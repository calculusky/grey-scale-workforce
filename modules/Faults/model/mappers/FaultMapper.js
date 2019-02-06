/**
 * Created by paulex on 7/4/17.
 */

const ModelMapper = require('../../../../core/model/ModelMapper');
// const Utils = require('../../../../core/Utility/Utils');


class FaultMapper extends ModelMapper {

    constructor(context) {
        super(context);
        this.primaryKey = "id";
        this.tableName = "faults";
        this.domainName = "Fault";
    }

}

module.exports = FaultMapper;