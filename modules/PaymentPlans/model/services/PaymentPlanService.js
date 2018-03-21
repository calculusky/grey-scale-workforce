const ApiService = require('../../../ApiService');
const DomainFactory = require('../../../DomainFactory');
let MapperFactory = null;
const Utils = require('../../../../core/Utility/Utils');
const validate = require('validate-fields')();
const Events = require('../../../../events/events');

/**
 * @name PaymentPlanService
 * Created by paulex on 8/22/17.
 */
class PaymentPlanService extends ApiService {

    constructor(context) {
        super(context);
        MapperFactory = this.context.modelMappers;
    }


    getPaymentPlans(value, by = "id", who = {api: -1}, offset = 0, limit = 10) {
        const PaymentPlanMapper = MapperFactory.build(MapperFactory.PAYMENT_PLAN);
        const executor = (resolve, reject) => {
            PaymentPlanMapper.findDomainRecord({by, value}, offset, limit)
                .then(result => {
                    let paymentPlans = result.records;
                    let processed = 0;
                    let rowLen = paymentPlans.length;
                    paymentPlans.forEach(async plan => {
                        const disconnection = await plan.disconnection();
                        plan['disconnection'] = disconnection.records.shift() || {};
                        if (Object.keys(plan['disconnection']).length > 0) {
                            plan['disconnection']['work_order_id'] = Utils.humanizeUniqueSystemNumber(
                                plan['disconnection']['work_order_id']
                            );
                        }
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

        //enforce the validation
        let isValid = validate(paymentPlan.rules(), paymentPlan);

        ApiService.insertPermissionRights(paymentPlan, who);

        if (!isValid) {
            return Promise.reject(Utils.buildResponse({status: "fail", data: {message: validate.lastError}}, 400));
        }

        const PaymentPlanMapper = MapperFactory.build(MapperFactory.PAYMENT_PLAN);

        // We need to check if a pending or an approved payment plan already exist for this disconnection
        // We shouldn't create a payment plan if either of an approved payment_plan or pending payment plan exist.
        let planExist = await db.table(PaymentPlanMapper.tableName)
            .where('disc_order_id', paymentPlan.disc_order_id).where(function () {
                this.where('approval_status', 0).orWhere('approval_status', 1);
            }).select(['approval_status']);

        if (planExist.length) {
            const approvalStatus = planExist.shift()['approval_status'];
            const res = Utils.buildResponse({
                status: "fail",
                data: {
                    message: `${
                        (approvalStatus === 1)
                            ? "An approved"
                            : "A pending"
                        } payment plan already exist for this disconnection`,
                    code: "DUPLICATE_PAYMENT_PLAN"
                }
            }, 400);
            return Promise.reject(res);
        }

        return PaymentPlanMapper.createDomainRecord(paymentPlan).then(paymentPlan => {
            if (!paymentPlan) return Promise.reject();

            const discId = paymentPlan.disc_order_id;
            let backgroundTask = [
                db.table("disconnection_billings").where('id', discId).update({has_plan: 1}),
                API.workflows().startCase("payment_plan", who, paymentPlan, PaymentPlanMapper.tableName)
            ];
            Promise.all(backgroundTask).then().catch(e => console.log(e));
            return Utils.buildResponse({data: paymentPlan});
        });
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

        let paymentPlan = await db.table("payment_plans").where('id', planId).select(['wf_case_id', 'assigned_to']);

        if (!paymentPlan.length) {
            const res = Utils.buildResponse({status: "fail", data: {message: "Payment Plan doesn't exist"}}, 400);
            return Promise.reject(res);
        }

        paymentPlan = paymentPlan.shift();

        const _command = {"COMMAND": "APPROVE"};

        const approve = await API.workflows().resume(paymentPlan.wf_case_id, comments, _command, who).catch(err => {
            console.log('PaymentPlanApproval', err);
            return Promise.reject(err);
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
                }, who).catch(console.error);
            }
            Events.emit("payment_plan_approval", planId, who);
        } else {
            //TODO return that the task doesn't exist or has already been approved/rejected
        }
        return Utils.buildResponse({data: paymentPlan});
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
        let paymentPlan = await db.table("payment_plans").where('id', planId).select(['wf_case_id', 'assigned_to']);

        if (!paymentPlan.length) {
            const res = Utils.buildResponse({status: "fail", data: {message: "Payment Plan doesn't exist"}}, 400);
            return Promise.reject(res);
        }

        paymentPlan = paymentPlan.shift();

        const _command = {"COMMAND": "REJECT"};

        const reject = await API.workflows().resume(paymentPlan.wf_case_id, comments, _command, who).catch(err => {
            console.log('PaymentPlanRejection', err);
            return Promise.reject(err);
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
                }, who).catch(console.error);
            }
            Events.emit("payment_plan_approval", planId, who, false);
        } else {
            console.log("No task was found");
            //TODO return that the task doesn't exist or has already been approved/rejected
        }
        return Utils.buildResponse({data: paymentPlan});
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