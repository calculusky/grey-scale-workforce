/**
 * Created by paulex on 2/28/18.
 */


const ModelMapper = require('../../../../core/model/ModelMapper');


class GroupMapper extends ModelMapper {
    constructor(context) {
        super(context);
        this.primaryKey = "id";
        this.tableName = "groups";
        this.domainName = "Group";
    }
}

module.exports = GroupMapper;