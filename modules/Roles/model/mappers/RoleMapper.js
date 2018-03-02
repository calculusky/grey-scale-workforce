/**
 * Created by paulex on 2/28/18.
 */


const ModelMapper = require('../../../../core/model/ModelMapper');


class RoleMapper extends ModelMapper {
    constructor(context) {
        super(context);
        this.primaryKey = "id";
        this.tableName = "roles";
        this.domainName = "Role";
    }
}

module.exports = RoleMapper;