/**
 * Created by paulex on 7/4/17.
 */
const DomainFactory = require('../../../DomainFactory');
const MapperFactory = require('../../../MapperFactory');
const Password = require('../../../../core/Utility/Password');
const Util = require('../../../../core/Utility/MapperUtil');

/**
 * @name TravelRequestService
 */
class TravelRequestService{
    
    constructor(){
        
    }

    getName(){
        return "travelRequestService";
    }
    
    getTravelRequests(value, by = "id", who = {api: -1}, offset, limit){
        if (!value || `${""+value+"".trim()}` == '') {
            //Its important that all queries are streamlined to majorly for each business
            value = who.api;
            by = "api_instance_id";
        } else if (value) {
            const temp = value;
            value = {};
            value[by] = temp;
            value['api_instance_id'] = who.api;
            by = "*_and";
        }
        const TravelRequestMapper = MapperFactory.build(MapperFactory.TRAVEL_REQUEST);
        return TravelRequestMapper.findDomainRecord({by, value}, offset, limit)
            .then(result=> {
                return (Util.buildResponse({data: {items: result.records}}));
            });
    }
    
    createTravelRequest(body = {}, who = {}){
        const TravelRequest = DomainFactory.build(DomainFactory.TRAVEL_REQUEST);
        body['api_instance_id'] = who.api;
        let travelRequest = new TravelRequest(body);
        //Get Mapper
        const TravelRequestMapper = MapperFactory.build(MapperFactory.TRAVEL_REQUEST);
        // console.log(travelRequest);
        return TravelRequestMapper.createDomainRecord(travelRequest).then(travelRequest=> {
            if (!travelRequest) return Promise.reject();
            return Util.buildResponse({data: travelRequest});
        });
    }
    
    deleteTravelRequest(by = "id", value){
        const TravelRequestMapper = MapperFactory.build(MapperFactory.TRAVEL_REQUEST);
        return TravelRequestMapper.deleteDomainRecord({by, value}).then(count=> {
            if (!count) {
                return Util.buildResponse({status: "fail", data: {message: "The specified record doesn't exist"}});
            }
            return Util.buildResponse({data: {message: "Travel Request deleted"}});
        });
    }
    
}

module.exports = TravelRequestService;