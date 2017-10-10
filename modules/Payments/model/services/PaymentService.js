const DomainFactory = require('../../../DomainFactory');
let MapperFactory = null;
const Password = require('../../../../core/Utility/Password');
// const Util = require('../../../../core/Utility/MapperUtil');
const Utils = require('../../../../core/Utility/Utils');
const validate = require('validate-fields')();

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
        //check here if the system exist
        //check the amount also if it is reasonable: thus amount cannot be zero
        
        //Get Mapper
        const PaymentMapper = MapperFactory.build(MapperFactory.PAYMENT);
        return PaymentMapper.createDomainRecord(payment).then(payment=> {
            if (!payment) return Promise.reject();
            return Utils.buildResponse({data: payment});
        });
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
}

module.exports = PaymentService;