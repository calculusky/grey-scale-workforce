const ModelMapper = require('../../../../core/model/ModelMapper');

/**
 * @author Paul Okeke
 * Created by paulex on 10/09/17.
 * @name PaymentMapper
 */
class PaymentMapper extends ModelMapper{
    constructor(context) {
        super(context);
        this.primaryKey = "id";
        this.tableName = "payments";
        this.domainName = "Payment";
    }
}

module.exports = PaymentMapper;