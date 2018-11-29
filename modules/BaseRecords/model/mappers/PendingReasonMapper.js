/**
 * Created by paulex on 8/30/18.
 */


const ModelMapper = require('../../../../core/model/ModelMapper');


class PendingReasonMapper extends ModelMapper{
    constructor(context) {
        super(context);
        this.primaryKey = "id";
        this.tableName = "fault_delay_reasons";
        this.domainName = "PendingReason";
    }

    _audit(){}
}

module.exports = PendingReasonMapper;