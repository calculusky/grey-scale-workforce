/**
 * Created by paulex on 9/19/17.
 */
const ModelMapper = require('../../../../core/model/ModelMapper');


class DisconnectionBillingMapper extends ModelMapper{
    constructor(context) {
        super(context);
        this.primaryKey = "id";
        this.tableName = "disconnection_billings";
        this.domainName = "DisconnectionBilling";
    }
}

module.exports = DisconnectionBillingMapper;