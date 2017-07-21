/**
 * Created by paulex on 7/4/17.
 */

const ModelMapper = require('../../../../core/model/ModelMapper');


class DepartmentMapper extends ModelMapper{
    constructor(context) {
        super(context);
        this.primaryKey = "id";
        this.tableName = "departments";
        this.domainName = "Department";
    }
}

module.exports = DepartmentMapper;