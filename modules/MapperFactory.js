/**
 * @author Paul Okeke
 * Created by paulex on 7/5/17.
 */
const Utils = require('../core/Utility/MapperUtil');
const mapperStore = {};

/**
 * @author Paul Okeke
 * 5th-July-2017
 * @name MapperFactory
 */
class MapperFactory {

    constructor() {

    }

    /**
     *
     * @param mapperName
     * @returns {UserMapper|TravelRequestMapper}
     */
    static build(mapperName = "") {
        switch (mapperName) {
            case MapperFactory.USER:
                return Utils.loadMapper(mapperStore, "../../modules/Users/model/mappers/UserMapper");
            case MapperFactory.TRAVEL_REQUEST:
                return Utils.loadMapper(mapperStore, "../../modules/TravelRequests/model/mappers/TravelRequestMapper");
            case MapperFactory.STAFF:
                return Utils.loadMapper(mapperStore, "../../modules/Staffs/model/mappers/StaffMapper");
            case MapperFactory.DEPARTMENT:
                return Utils.loadMapper(mapperStore, "../../modules/Departments/model/mappers/DepartmentMapper");
        }
    }
}

MapperFactory.USER = "User";
MapperFactory.STAFF = "Staff";
MapperFactory.TRAVEL_REQUEST = "TravelRequest";
MapperFactory.DEPARTMENT = "Department";

module.exports = MapperFactory;
