/**
 * Created by paulex on 8/08/18.
 */


const ModelMapper = require('../../../../core/model/ModelMapper');


class ActivityMapper extends ModelMapper {
    constructor(context) {
        super(context);
        this.primaryKey = "id";
        this.tableName = "activities";
        this.domainName = "Activity";
    }

    _audit(data, type = "CREATE") {
        //overrides the default audit function
    }
}

module.exports = ActivityMapper;