const ApiService = require('../../../ApiService');
const DomainFactory = require('../../../DomainFactory');
let MapperFactory = null;
const Utils = require('../../../../core/Utility/Utils');
const validate = require('validatorjs');
const Events = require('../../../../events/events');
const Error = require('../../../../core/Utility/ErrorUtils')();

/**
 * @name PaymentPlanService
 * Created by paulex on 8/22/17.
 */
class PaymentPlanService extends ApiService {

    constructor(context) {
        super(context);
        MapperFactory = this.context.modelMappers;
    }


    getPaymentPlans(value, by = "id", who = {}, offset = 0, limit = 10, relation = {disconnection: true}) {
        const PaymentPlanMapper = MapperFactory.build(MapperFactory.PAYMENT_PLAN);
        const db = this.context.database;
        const executor = (resolve, reject) => {
            PaymentPlanMapper.findDomainRecord({by, value}, offset, limit)
                .then(result => {
                    let paymentPlans = result.records, processed = 0, rowLen = paymentPlans.length;
                    paymentPlans.forEach(async plan => {
                        const task = [
                            (relation.disconnection) ? plan.disconnection() : {records: []},
                            plan.createdBy(),
                            plan.approvedBy()
                        ];

                        task.push(Utils.getAssignees(plan.assigned_to, db));

                        const [disconnection, createdBy, approvedBy, assignee] = await Promise.all(task);

                        const disc = disconnection.records.shift() || {};

                        plan["disconnection"] = disc;

                        if (Object.keys(disc).length > 0) {
                            disc['work_order_id'] = Utils.humanizeUniqueSystemNumber(disc['work_order_id']);
                            const {records: [{customer_name, mobile_no, plain_address}]} = await disc.customer();
                            plan["disconnection"]['customer'] = {customer_name, mobile_no, plain_address};
                        }

                        plan['assigned_to'] = assignee || [];
                        plan['created_by'] = createdBy.records.map(i=>({id:i.id, username:i.username})).pop() || {};
                        plan['approved_by'] = approvedBy.records.map(i=>({id:i.id, username:i.username})).pop() || {};
                        plan['for'] = plan.assigned_to.find(u => (u.id === who.sub)) || {};
                        if (++processed === rowLen) return resolve(Utils.buildResponse({data: {items: paymentPlans}}));
                    });
                })
                .catch(err => {
                    return reject(Utils.buildResponse({status: "fail", data: err}, 500));
                });
        };
        return new Promise(executor);
    }

    /**
     * Creates a payment plan
     *
     * @param body
     * @param who
     * @param API {API}
     */
    async createPaymentPlan(body = {}, who = {}, API) {
        const db = this.context.database;
        const PaymentPlan = DomainFactory.build(DomainFactory.PAYMENT_PLAN);
        let paymentPlan = new PaymentPlan(body);

        //Because of the issue with form data that sends numeric-strings
        Utils.numericToInteger(paymentPlan, 'waive_percentage', 'amount', 'disc_order_id', 'balance');

        paymentPlan.assigned_to = Utils.serializeAssignedTo(paymentPlan.assigned_to);

        //enforce the validation
        let validator = new validate(paymentPlan, paymentPlan.rules(), paymentPlan.customErrorMessages());

        ApiService.insertPermissionRights(paymentPlan, who);

        if (validator.fails()) return Promise.reject(Error.ValidationFailure(validator.errors.all()));

        const PaymentPlanMapper = MapperFactory.build(MapperFactory.PAYMENT_PLAN);
        const tblName = PaymentPlanMapper.tableName;

        // We need to check if a pending or an approved payment plan already exist for this disconnection
        // We shouldn't create a payment plan if either of an approved payment_plan or pending payment plan exist.
        let planExist = await db.table(PaymentPlanMapper.tableName)
            .where('disc_order_id', paymentPlan.disc_order_id).where(function () {
                this.where('approval_status', 0).orWhere('approval_status', 1);
            }).where("deleted_at", null).select(['approval_status']);

        if (planExist.length) {
            const approvalStatus = planExist.shift()['approval_status'];
            const res = Utils.buildResponse({
                status: "fail",
                message: `${
                    (approvalStatus === 1)
                        ? "An approved"
                        : "A pending"
                    } payment plan already exist for this disconnection`,
                code: "DUPLICATE_PAYMENT_PLAN"
            }, 400);
            return Promise.reject(res);
        }

        paymentPlan['wf_case_id'] = await API.workflows().startCase("payment_plan", who, paymentPlan).catch(err => {
            return Promise.reject(err);
        });

        const dbPlan = await PaymentPlanMapper.createDomainRecord(paymentPlan).catch(err => {
            API.workflows().deleteCase(paymentPlan['wf_case_id'], who).catch(console.error);
            return Promise.reject(err);
        });

        API.workflows().routeCase(dbPlan['wf_case_id'], who).then(() => {
            API.workflows().assignCase(dbPlan['wf_case_id'], dbPlan, tblName, who);
        });

        let bgTask = [db.table("disconnection_billings").where('id', dbPlan.disc_order_id).update({has_plan: 1})];

        Promise.all(bgTask).catch(console.error);
        return Utils.buildResponse({data: dbPlan});
    }


    /**
     *
     * @param planId
     * @param body
     * @param who
     * @param API {API}
     * @returns {Promise<>|*}
     */
    async approvePaymentPlan(planId, {comments = ""}, who, API) {
        const db = this.context.database;

        const planCols = ['wf_case_id', 'assigned_to', 'approval_status'];

        let plan = await db.table("payment_plans").where('id', planId).select(planCols);

        if (!plan.length) {
            const res = Utils.buildResponse({status: "fail", data: {message: "Payment Plan doesn't exist"}}, 400);
            return Promise.reject(res);
        }

        plan = plan.shift();

        if (plan['approval_status'] !== 0) return Promise.reject(Utils.paymentPlanProcessed(plan['approval_status']));

        const _command = {"COMMAND": "APPROVE"};

        const approve = await API.workflows().resume(plan.wf_case_id, comments, _command, who).catch(err => {
            console.log('PaymentPlanApproval', err);
            return Promise.reject(Utils.processMakerError(err));
        });
        // If the task has already been completed or a task doesn't exist
        // 1 is returned; so we should ignore the comments
        if (approve !== 1) {
            // Set the approval_status to approved
            // We can as well choose to notify the user who created it that it has been approved
            db.table("payment_plans").where("id", planId).update({
                approval_status: 1,
                approved_by: who.sub,
                approval_date: Utils.date.dateToMysql()
            }).then(console.log).catch(console.error);

            if (comments.length) {
                API.notes().createNote({
                    relation_id: `${planId}`,
                    module: 'payment_plans',
                    note: `Payment Plan Approval : ${comments}`
                }, who, API).catch(console.error);
            }
            Events.emit("payment_plan_approval", planId, who);
        }
        return Utils.buildResponse({data: plan});
    }


    /**
     * Rejects a payment plan
     *
     * @param planId
     * @param body
     * @param who
     * @param API {API}
     * @returns {Promise<>|*}
     */
    async rejectPaymentPlan(planId, {comments}, who, API) {
        const db = this.context.database;

        const planCols = ['wf_case_id', 'assigned_to', 'approval_status'];

        let plan = await db.table("payment_plans").where('id', planId).select(planCols);

        if (!plan.length) {
            const res = Utils.buildResponse({status: "fail", data: {message: "Payment Plan doesn't exist"}}, 400);
            return Promise.reject(res);
        }

        plan = plan.shift();

        if (plan['approval_status'] !== 0) return Promise.reject(Utils.paymentPlanProcessed(plan['approval_status']));

        const _command = {"COMMAND": "REJECT"};

        const reject = await API.workflows().resume(plan.wf_case_id, comments, _command, who).catch(err => {
            console.log('PaymentPlanRejection', err);
            return Promise.reject(Utils.processMakerError(err));
        });
        // If the task has already been completed or a task doesn't exist
        // 1 is returned; so we should ignore the comments
        if (reject !== 1) {
            db.table("payment_plans").where("id", planId).update({approval_status: -1}).catch(console.error);
            if (comments && comments.length) {
                API.notes().createNote({
                    relation_id: planId,
                    module: 'payment_plans',
                    note: `Payment Plan Rejection : ${comments}`
                }, who, API).catch(console.error);
            }
            Events.emit("payment_plan_approval", planId, who, false);
        }
        return Utils.buildResponse({data: plan});
    }

    updatePaymentPlan() {

    }


    /**
     *
     * @param by
     * @param value
     * @returns {*}
     */
    deletePaymentPlan(by = "id", value) {
        const PaymentPlanMapper = MapperFactory.build(MapperFactory.PAYMENT_PLAN);
        return PaymentPlanMapper.deleteDomainRecord({by, value}).then(count => {
            if (!count) {
                return Utils.buildResponse({status: "fail", data: {message: "The specified record doesn't exist"}});
            }
            return Utils.buildResponse({data: {by, message: "PaymentPlan deleted"}});
        });
    }
}

module.exports = PaymentPlanService;