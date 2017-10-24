const DomainFactory = require('../../../DomainFactory');
let MapperFactory = null;
const Password = require('../../../../core/Utility/Password');
const Log = require('../../../../core/logger');
const Utils = require('../../../../core/Utility/Utils');
const validate = require('validate-fields')();
const TAG =  "PaymentService:";

/**
 * @name PaymentService
 * Created by paulex on 10/09/17.
 */
class PaymentService {

    constructor(context) {
        this.context = context;
        MapperFactory = this.context.modelMappers;
    }

    getName() {
        return "paymentService";
    }

    getPayments(value, by = "id", who = {api: -1}, offset = 0, limit = 10) {
        const PaymentMapper = MapperFactory.build(MapperFactory.PAYMENT);
        var executor = (resolve, reject)=> {
            PaymentMapper.findDomainRecord({by, value}, offset, limit)
                .then(result=> {
                    let payments = result.records;
                    let processed = 0;
                    let rowLen = payments.length;
                    return resolve(Utils.buildResponse({data: {items: result.records}}));
                })
                .catch(err=> {
                    return reject(err);
                });
        };
        return new Promise(executor)
    }

    /**
     *
     * @param body
     * @param who
     */
    createPayment(body = {}, who = {}) {
        const Payment = DomainFactory.build(DomainFactory.PAYMENT);
        let payment = new Payment(body);
        //enforce the validation
        let isValid = validate(payment.rules(), payment);
        if (!isValid) {
            return Promise.reject(Utils.buildResponse({status: "fail", data: {message: validate.lastError}}, 400));
        }
        payment.system_id = payment.system_id.replace(/-/g, "");
        //check if the system exist
        let systemType = PaymentService.getPaymentType(payment.system);
        if (systemType == null) {
            return Promise.reject(Utils.buildResponse({
                status: "fail",
                msg: "Invalid System Name Specified",
                code: "INVALID_SYSTEM_NAME",
                desc: `The system name you specified '${payment.system}' doesn't exist or is currently not been handled`
            }, 400));
        }
        var executor = (resolve, reject)=> {

            let resultSet = this.context.database.table(systemType.table)
                .select(['id', 'status', 'work_order_no', 'type_id']).where(systemType.key, payment.system_id);

            resultSet.then(result=> {
                if (!result.length) {
                    return reject(Utils.buildResponse({
                        status: "fail",
                        msg: "Invalid Work Order Number",
                        code: "INVALID_WORK_ORDER_NO",
                        desc: `The Work Order Number specified '${payment.system_id}' does not exist or it is invalid`
                    }, 400));
                }
                const workTypes = this.context.persistence.getItemSync("work_types");
                //get the domain
                const Domain = systemType.domain;
                const domain = new Domain(result.shift());
                //check the type is valid for payments
                let typeName = workTypes[domain.type_id].name.toLowerCase();
                if (typeName != "disconnection") {
                    //lets bounce this guy back because he cannot be paying for anything other than disconnection
                    return reject(Utils.buildResponse({
                        status: "fail",
                        msg: "Work order cannot acknowledge payments",
                        code: "NOT_DISCONNECTION",
                        desc: `Payment to this work order '${payment.system_id}' isn't supported`
                    }, 403));
                }
                //check status
                if (domain.status != 3) {
                    //this disconnection order isn't in its disconnection state
                    return reject(Utils.buildResponse({
                        status: "fail",
                        msg: "Invalid state to acknowledge payment",
                        code: "INVALID_ACK_STATE",
                        desc: "The work order is not in the right state to acknowledge payments. " +
                        "Only when the status is disconnected can payments be acknowledged"
                    }, 403));
                }
                domain.disconnection().then(results=> {
                    let disconnectionOrder = results.records.shift();
                    const minAmountAccepted = parseFloat(disconnectionOrder.min_amount_payable);
                    if (payment.amount < minAmountAccepted) {
                        return reject(Utils.buildResponse({
                            status: "fail",
                            msg: "The amount is not acceptable",
                            code: "INVALID_AMOUNT",
                            desc: `The amount must be equal or above the minimum amount payable ${minAmountAccepted}`
                        }, 400));
                    }
                    //now check that this transaction id hasn't been processed yet
                    let res = this.context.database.count('id as transactions').from("payments")
                        .where("transaction_id", payment.transaction_id).orWhere('system_id', payment.system_id);

                    res.then(result=> {
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
                        PaymentMapper.createDomainRecord(payment).then(payment=> {
                            if (!payment) return Promise.reject();
                            return resolve(Utils.buildResponse({data: payment}));
                        });

                        let resUpdate = this.context.database.table('work_orders').update({status:5})
                            .where(systemType.key, payment.system_id);

                        //can we also update the status of the work order at the background and also create a
                        resUpdate.then(r=>console.log()).catch(err=> Log.e(TAG, JSON.stringify(err)));

                        //reconnection order
                        //TODO get the logic to create a reconnection order
                    })
                });
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
        return PaymentMapper.deleteDomainRecord({by, value}).then(count=> {
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
                break;
            default:
                return null;
        }
    }
}

module.exports = PaymentService;