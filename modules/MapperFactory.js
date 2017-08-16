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
            case MapperFactory.WORK_ORDER:
                return Utils.loadMapper(mapperStore, "../../modules/WorkOrders/model/mappers/WorkOrderMapper");
            case MapperFactory.STAFF:
                return Utils.loadMapper(mapperStore, "../../modules/Staffs/model/mappers/StaffMapper");
            case MapperFactory.FAULT:
                return Utils.loadMapper(mapperStore, "../../modules/Faults/model/mappers/FaultMapper");
        }
    }
}

MapperFactory.USER = "User";
MapperFactory.STAFF = "Staff";
MapperFactory.WORK_ORDER = "TravelRequest";
MapperFactory.FAULT = "Fault";

module.exports = MapperFactory;
