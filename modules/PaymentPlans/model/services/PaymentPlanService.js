const ApiService = require('../../../ApiService');
const DomainFactory = require('../../../DomainFactory');
let MapperFactory = null;
const Utils = require('../../../../core/Utility/Utils');
const validate = require('validate-fields')();

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
                    let assets = result.records;
                    let processed = 0;
                    let rowLen = assets.length;

                    // assets.forEach(asset=> {
                    //     asset.user().then(res=> {
                    //         asset.user = res.records.shift();
                    //         if (++processed == rowLen)
                    //             return resolve(Utils.buildResponse({data: {items: result.records}}));
                    //     }).catch(err=> {
                    //         return reject(err)
                    //     })
                    // })
                })
                .catch(err => {
                    return reject(err);
                });
        };
        return new Promise(executor)
    }

    /**
     *
     * @param body
     * @param who
     * @param API {API}
     */
    createPaymentPlan(body = {}, who = {}, API) {
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

        //Get Mapper
        const PaymentPlanMapper = MapperFactory.build(MapperFactory.PAYMENT_PLAN);
        return PaymentPlanMapper.createDomainRecord(paymentPlan).then(paymentPlan => {
            if (!paymentPlan) return Promise.reject();

            let updateDisc = this.context.database.table("disconnection_billings")
                .where('id', paymentPlan.disc_order_id).update({has_plan: 1});

            Promise.all([
                updateDisc,
                API.workflows().startCase("payment_plan", who, paymentPlan, PaymentPlanMapper.tableName)
            ]).then().catch(e => console.log(e));

            return Utils.buildResponse({data: paymentPlan});
        });
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