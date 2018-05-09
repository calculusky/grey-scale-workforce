'use strict';
const DomainFactory = require('../../../DomainFactory');
let MapperFactory = null;
const Log = require('../../../../core/logger');
const Utils = require('../../../../core/Utility/Utils');
const Error = require('../../../../core/Utility/ErrorUtils')();
const validate = require('validatorjs');
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
     *  Acknowledge a Payments
     * @param body
     * @param who
     * @param API {API}
     */
    createPayment(body = {}, who = {}, API) {
        console.log(body);
        const Payment = DomainFactory.build(DomainFactory.PAYMENT);
        let payment = new Payment(body);

        //If auto generate isn't specified, we'll generate it by default
        const autoGenerateRC = body['auto_generate_rc'];
        body['auto_generate_rc'] = (autoGenerateRC === undefined) ? true : autoGenerateRC;
        if (typeof autoGenerateRC === 'string') body['auto_generate_rc'] = (autoGenerateRC === 'true');

        //Prepare the static data from persistence storage
        let {groups, workTypes} = [{}, {}];
        this.context.persistence.get("groups", (err, grps) => {
            if (!err) groups = JSON.parse(grps);
        });

        this.context.persistence.get("work:types", (err, types) => {
            if (!err) workTypes = JSON.parse(types);
        });

        if (!isNaN(payment.amount)) payment.amount = parseFloat(payment.amount);

        //enforce the validation
        let validator = new validate(payment, payment.rules(), payment.customErrorMessages());

        if (validator.fails()) return Promise.reject(Error.ValidationFailure(validator.errors.all()));

        payment.payment_date = Utils.date.dateToMysql(payment.payment_date);

        payment.system_id = payment.system_id.replace(/-/g, "").toUpperCase();
        //check if the system exist
        let systemType = PaymentService.getPaymentType(payment.system);

        if (systemType == null) {
            return Promise.reject(Utils.buildResponse({
                status: "fail",
                msg: "Invalid System Name Specified",
                code: "INVALID_SYSTEM_NAME",
                desc: `The system name you specified '${payment.system}' doesn't exist or is currently not being handled`
            }, 400));
        }
        const executor = (resolve, reject) => {
            const db = this.context.database;
            const columns = ['id', 'status', 'work_order_no', 'assigned_to', 'group_id', 'type_id', 'address_line',
                'related_to', 'relation_id'];

            const resultSet = db.table(systemType.table).select(columns).where(systemType.key, payment.system_id);

            resultSet.then(result => {
                if (!result.length) {
                    return reject(Utils.buildResponse({
                        status: "fail",
                        msg: "Invalid Work Order Number",
                        code: "INVALID_WORK_ORDER_NO",
                        desc: `The Work Order Number specified '${payment.system_id}' does not exist or it is invalid`
                    }, 400));
                }

                //get the domain
                const Domain = systemType.domain;
                const workOrder = new Domain(result.shift());
                //check the type is valid for payments
                let typeName = workTypes[workOrder.type_id].name.toLowerCase();
                if (!typeName.includes("disconnections")) {
                    //lets bounce this guy back because he cannot be paying for anything other than disconnection
                    return reject(Utils.buildResponse({
                        status: "fail",
                        msg: "Work order cannot acknowledge payments",
                        code: "NOT_DISCONNECTION",
                        desc: `Payment to this type of work order '${payment.system_id}' isn't supported`
                    }, 403));
                }
                //check status : only accept payment for work order in disconnected state
                if (workOrder.status !== 3) {
                    //this disconnection order isn't in a disconnection state
                    return reject(Utils.buildResponse({
                        status: "fail",
                        msg: "Invalid state to acknowledge payment",
                        code: "INVALID_ACK_STATE",
                        desc: "The work order is not in the right state to acknowledge payments. " +
                        "Only when the status is disconnected can payments be acknowledged"
                    }, 403));
                }

                workOrder.relatedTo().then(results => {
                    let disconnection = results.records.shift();
                    const minAmountAccepted = parseFloat(disconnection.min_amount_payable);
                    //Check if this disconnection order has a payment plan
                    //thus use the amount on the payment plan
                    if (!disconnection['has_plan'] && (payment.amount < minAmountAccepted)) {
                        return reject(Utils.buildResponse({
                            status: "fail",
                            msg: "The amount is not acceptable",
                            code: "INVALID_AMOUNT",
                            desc: `The amount must be equal to or above the minimum amount payable (${minAmountAccepted})`
                        }, 400));
                    } else if (disconnection['has_plan']) {
                        //Get the payment plan
                        return disconnection.paymentPlan().then(res => {
                            let paymentPlan = res.records.shift();
                            if (!paymentPlan || payment.amount < paymentPlan.amount) {
                                return reject(Utils.buildResponse({
                                    status: "fail",
                                    msg: "The amount is not acceptable",
                                    code: "INVALID_PLANNED_AMOUNT",
                                    desc: `The amount paid is lower than the amount specified on the payment plan (${paymentPlan.amount})`
                                }, 400));
                            }
                            return beginTransaction();
                        });
                    }
                    return beginTransaction();
                }).catch(reject);

                const beginTransaction = () => {
                    //Check that this transaction id hasn't been processed yet
                    let res = db.count('id as transactions').from("payments")
                        .where("transaction_id", payment.transaction_id).orWhere('system_id', payment.system_id);

                    return res.then(result => {
                        if (result.shift()['transactions']) {
                            //then lets tell the user that this transaction id already exist
                            return reject(Utils.buildResponse({
                                status: "fail",
                                msg: "Duplicate Transaction",
                                code: "TRANSACTION_ALREADY_EXIST",
                                desc: `The work order has previously been acknowledged.`
                            }, 403));
                        }
                        //Now that everything is fine... lets now create the payment
                        const PaymentMapper = MapperFactory.build(MapperFactory.PAYMENT);
                        //however let set the group and assigned to value
                        const date = Utils.date.dateToMysql(new Date(), 'YYYY-MM-DD H:m:s');

                        payment.group_id = workOrder.group_id;

                        if (!workOrder.assigned_to.find(item => item.id === who.sub))
                            workOrder.assigned_to.push({"id": who.sub, created_at: date});

                        payment.assigned_to = JSON.stringify(workOrder.assigned_to);

                        PaymentMapper.createDomainRecord(payment).then(payment => {
                            if (!payment) return Promise.reject(false);
                            return resolve(Utils.buildResponse({data: payment}));
                        }).catch(console.error);

                        //Update work order status to payment received
                        db.table('work_orders').update({status: 5}).where(systemType.key, payment.system_id)
                            .catch(err => Log.e(TAG, JSON.stringify(err)));

                        const createReconnectionOrder = (result) => {
                            //if it exist don't create a reconnection order
                            if (result.shift()['id']) return;

                            let reconnectionOrder = {
                                "related_to": "disconnection_billings",
                                "relation_id": workOrder.relation_id,
                                "status": '1',
                                "labels": '[]',
                                "priority": '3',
                                "summary": "Re-connect this Customer",
                                "address_line": workOrder.address_line,
                                "type_id": 2,//2 means reconnection
                                "group_id": workOrder.group_id,
                                "assigned_to": JSON.stringify(workOrder.assigned_to),
                                "issue_date": date
                            };
                            console.log('Reconnection', reconnectionOrder);
                            API.workOrders().createWorkOrder(reconnectionOrder).catch(err => console.error('PAYMENTS', err));
                        };
                        //By default we create reconnection orders.
                        if (body['auto_generate_rc']) {
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
                        return null;
                    }).catch(err => {
                        //TODO revert the status of the work order to 3
                        //TODO delete the payment record
                        console.log(err);
                    });
                };
            });
        };
        return new Promise(executor);
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
     * @returns {*}
     */
    deletePayment(by = "id", value) {
        const PaymentMapper = MapperFactory.build(MapperFactory.PAYMENT);
        return PaymentMapper.deleteDomainRecord({by, value}).then(count => {
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