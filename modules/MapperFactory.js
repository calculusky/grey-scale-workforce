/**
 * Created by paulex on 7/5/17.
 */
const Utils = require('../core/Utility/MapperUtil');
const mapperStore = {};

/**
 * @name MapperFactory
 */
class MapperFactory {

    constructor() {

    }

    static build(mapperName = "") {
        switch (mapperName) {
            case MapperFactory.USER:
                return Utils.loadMapper(mapperStore, "../../modules/Users/model/mappers/UserMapper");
                break;
            case MapperFactory.TRAVEL_REQUEST:
                return Utils.loadMapper(mapperStore, "../../modules/TravelRequests/model/mappers/TravelRequestMapper");
                break;
        }
    }
}

MapperFactory.USER = "User";
MapperFactory.TRAVEL_REQUEST = "TravelRequest";

module.exports = MapperFactory;
