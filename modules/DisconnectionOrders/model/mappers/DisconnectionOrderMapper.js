/**
 * Created by paulex on 9/19/17.
 */
const ModelMapper = require('../../../../core/model/ModelMapper');


class DisconnectionOrderMapper extends ModelMapper{
    constructor(context) {
        super(context);
        this.primaryKey = "id";
        this.tableName = "disconnection_orders";
        this.domainName = "DisconnectionOrder";
    }
}

module.exports = DisconnectionOrderMapper;