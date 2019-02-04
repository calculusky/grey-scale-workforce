'use strict';
const DomainFactory = require('../../../DomainFactory');
let MapperFactory = null;
const Log = require('../../../../core/logger');
const Utils = require('../../../../core/Utility/Utils');
const Error = require('../../../../core/Utility/ErrorUtils')();
const TAG = "PaymentService:";

/**
 * @author Paul Okeke
 * @name PaymentService
 * Created by paulex on 10/09/17.
 */
class PaymentService {

    constructor(context) {
        this.context = context;
        MapperFactory = this.context.modelMappers;
    }

    /**
     * Retrieve Payment Acknowledgements
     * @param value
     * @param by
     * @param who
     * @param offset
     * @param limit
     * @returns {Promise}
     */
    getPayments(value, by = "id", who = {api: -1}, offset = 0, limit = 10) {
        const PaymentMapper = MapperFactory.build(MapperFactory.PAYMENT);
        const executor = (resolve, reject) => {
            PaymentMapper.findDomainRecord({by, value}, offset, limit)
                .then(result => {
                    let payments = result.records;
                    let processed = 0;
                    let rowLen = payments.length;
                    return resolve(Utils.buildResponse({data: {items: result.records}}));
                })
                .catch(err => {
                    return reject(err);
                });
        };
        return new Promise(executor)
    }

    /**
     * Acknowledge a Payments
     *
     * @param body {Object}
     * @param who {Session}
     * @param API {API}
     */
    async createPayment(body = {}, who, API) {
        const Payment = DomainFactory.build(DomainFactory.PAYMENT);
        const payment = new Payment(body);
        const db = this.context.db();
        const autoGenerateRC = !!body['auto_generate_rc'];
        const workTypes = await this.context.getKey("work:types", true);

        payment.setPaymentAmount(/*default*/);
        payment.setPaymentDate(Utils.date.dateToMysql(payment.payment_date));
        payment.setSystemId(/*default*/);

        if (!payment.validate()) return Promise.reject(Error.ValidationFailure(payment.getErrors().all()));

        const systemType = PaymentService.getPaymentType(payment.system);

        if (systemType === null) return Promise.reject(Error.InvalidSystemName(payment.system));

        const model = (await db.table(systemType.table).select(['*']).where(systemType.key, payment.system_id)).shift();

        if (!model) return Promise.reject(Error.InvalidWorkOrderNo(payment.system_id));

        const Domain = systemType.domain;
        const workOrder = new Domain(model);
        const typeName = workTypes[workOrder.type_id].name.toLowerCase();

        if (!typeName.includes("disconnections")) return Promise.reject(Error.NotDisconnection(payment.system_id));
        if (workOrder.status !== 3) return Promise.reject(Error.InvalidAckState);

        const disconnection = (await workOrder.relatedTo()).records.shift();

        if(!disconnection) return Promise.reject(Error.InternalServerError);

        const minAmountAccepted = parseFloat(disconnection.min_amount_payable);
        const amountIsLesser = payment.amount < minAmountAccepted;
        //Check if this disconnection order has a payment plan; then use the amount on the payment plan
        if (disconnection['has_plan']) {
            const res = await disconnection.paymentPlan();
            const paymentPlan = res.records.pop();
            if (paymentPlan && (paymentPlan.approval_status === -1 && amountIsLesser)) {
                return Promise.reject(Error.InvalidDisconnectionAmount(minAmountAccepted));
            }
            else if (!paymentPlan || (payment.amount < paymentPlan.amount)) {
                return Promise.reject(Error.InvalidPaymentPlanAmount(paymentPlan.amount));
            }
            return await this.beginTransaction(payment, workOrder, who, API, autoGenerateRC);
        }
        if (amountIsLesser) return Promise.reject(Error.InvalidDisconnectionAmount(minAmountAccepted));

        return await this.beginTransaction(payment, workOrder, who, API, autoGenerateRC);
    }

    /**
     *
     * @private
     * @param payment {Payment}
     * @param workOrder {WorkOrder}
     * @param who {Session}
     * @param API {API}
     * @param auto
     * @returns {Promise<*>}
     */
    async beginTransaction(payment, workOrder, who, API, auto=true) {
        const PaymentMapper = MapperFactory.build(MapperFactory.PAYMENT);
        const db = this.context.db();

        const res = (await db.count('id as transactions').from("payments")
            .where("transaction_id", payment['transaction_id']).orWhere('system_id', payment.system_id)).shift();

        if(res && res['transactions']) return Promise.reject(Error.TransactionAlreadyExist);

        payment.setGroupId(workOrder['group_id']);
        payment.setAssignedTo(workOrder.assigned_to);

        PaymentMapper.createDomainRecord(payment, who).then(payment => {
            if (!payment) return Promise.reject(false);
            return Promise.resolve(Utils.buildResponse({data: payment}));
        }).catch(console.error);

        //Update work order status to payment received
        API.workOrders().changeWorkOrderStatus(workOrder.id, 5/*Payment Received*/, who, null, [], API)
            .catch(err => Log.e(TAG, JSON.stringify(err)));

        const createReconnectionOrder = (result) => {
            if (result.shift()['id']) return;

            const reconnectionOrder = {
                "related_to": "disconnection_billings",
                "relation_id": workOrder.relation_id,
                "status": '1',
                "labels": '[]',
                "priority": '3',
                "summary": "Re-connect this Customer",
                "address_line": workOrder['address_line'],
                "type_id": 2,//2 means reconnection
                "group_id": workOrder['group_id'],
                "assigned_to": JSON.stringify(workOrder.assigned_to),
                "issue_date": Utils.date.dateToMysql()
            };
            console.log('Reconnection', reconnectionOrder);
            API.workOrders().createWorkOrder(reconnectionOrder, who, [], API).catch(err => console.error('PAYMENTS', err));
        };

        if (auto) {
            /*
             * @author Paul Okeke
             * Check if there already exist a reconnection order for this work-order
             * This is to avoid that we don't have duplicates
             **/
            db.count('id as id').from('work_orders').where({
                related_to: 'disconnection_billings',
                relation_id: workOrder.relation_id,
                type_id: 2
            }).then(createReconnectionOrder);
        }
        return Utils.buildResponse({data: payment});
    }


    // /**
    //  * We are majorly searching for payment by name
    //  * @param keyword
    //  * @param offset
    //  * @param limit
    //  * @returns {Promise.<Customer>}
    //  */
    // searchPayments(keyword, offset = 0, limit = 10) {
    //     const Customer = DomainFactory.build(DomainFactory.PAYMENT);
    //     let fields = [
    //         'id',
    //         'payment_type',
    //         'payment_type_name',
    //         'payment_name',
    //         'status',
    //         'group_id',
    //         'serial_no'
    //     ];
    //     let resultSets = this.context.database.select(fields).from('payments')
    //         .where('payment_name', 'like', `%${keyword}%`).orWhere('payment_type_name', 'like', `%${keyword}%`);
    //     resultSets = resultSets.limit(parseInt(limit)).offset(parseInt(offset)).orderBy('payment_name', 'asc');
    //
    //     return resultSets.then(results=> {
    //         let customers = [];
    //         results.forEach(customer=>customers.push(new Customer(customer)));
    //         return Utils.buildResponse({data: {items: customers}});
    //     }).catch(err=> {
    //         return Utils.buildResponse({status: "fail", data: err}, 500);
    //     });
    // }

    /**
     *
     * @param by
     * @param value
     * @param who
     * @param API {API}
     * @returns {*}
     */
    deletePayment(by = "id", value, who, API) {
        const PaymentMapper = MapperFactory.build(MapperFactory.PAYMENT);
        return PaymentMapper.deleteDomainRecord({by, value}, true, who).then(count => {
            if (!count) {
                return Utils.buildResponse({status: "fail", data: {message: "The specified record doesn't exist"}});
            }
            return Utils.buildResponse({data: {by, message: "Payment deleted"}});
        });
    }

    static getPaymentType(system) {
        switch (system) {
            case "work_orders":
                return {
                    table: "work_orders",
                    key: "work_order_no",
                    domain: DomainFactory.build(DomainFactory.WORK_ORDER)
                };
            default:
                return null;
        }
    }
}

module.exports = PaymentService;