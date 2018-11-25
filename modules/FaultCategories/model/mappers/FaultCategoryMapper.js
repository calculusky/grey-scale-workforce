/**
 * Created by paulex on 07/10/18.
 */


const ModelMapper = require('../../../../core/model/ModelMapper');


class FaultCategoryMapper extends ModelMapper {
    constructor(context) {
        super(context);
        this.primaryKey = "id";
        this.tableName = "fault_categories";
        this.domainName = "FaultCategory";
    }

    _audit(){}
}

module.exports = FaultCategoryMapper;