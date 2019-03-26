/**
 * Created by paulex on 03/26/19.
 */


const ModelMapper = require('../../../../core/model/ModelMapper');


class StatusMapper extends ModelMapper{
    constructor(context) {
        super(context);
        this.primaryKey = "id";
        this.tableName = "statuses";
        this.domainName = "Status";
    }

    _audit(){}
}

module.exports = StatusMapper;