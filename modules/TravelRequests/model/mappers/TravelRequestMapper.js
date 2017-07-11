/**
 * Created by paulex on 7/5/17.
 */
const ModelMapper = require('../../../../core/model/ModelMapper');

class TravelRequestMapper extends ModelMapper{

    constructor(context){
        super(context);
        this.primaryKey = "id";
        this.tableName = "travel_requests";
        this.domainName = "TravelRequest";
    }
}

module.exports = TravelRequestMapper;