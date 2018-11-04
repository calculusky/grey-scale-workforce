/**
 * Created by paulex on 11/2/18.
 */


const ModelMapper = require('../../../../core/model/ModelMapper');


class LocationHistoryMapper extends ModelMapper {
    constructor(context) {
        super(context);
        this.primaryKey = "id";
        this.tableName = "location_history";
        this.domainName = "LocationHistory";
    }
}

module.exports = LocationHistoryMapper;