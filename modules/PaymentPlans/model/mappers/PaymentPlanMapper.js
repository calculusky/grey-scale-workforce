/**
 * Created by paulex on 8/22/17.
 */


const ModelMapper = require('../../../../core/model/ModelMapper');


class PaymentPlanMapper extends ModelMapper {
    constructor(context) {
        super(context);
        this.primaryKey = "id";
        this.tableName = "payment_plans";
        this.domainName = "PaymentPlan";
    }
}

module.exports = PaymentPlanMapper;