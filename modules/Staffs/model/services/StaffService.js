const DomainFactory = require('../../../DomainFactory');
const MapperFactory = require('../../../MapperFactory');
const Password = require('../../../../core/Utility/Password');
const Util = require('../../../../core/Utility/MapperUtil');
/**
 * @name StaffService
 * Created by paulex on 7/4/17.
 */
class StaffService {

    constructor() {

    }

    getName() {
        return "staffService";
    }

    getStaffs(value, by = "id", who = {api: -1}, offset = 0, limit = 10) {
        if (!value || value.trim() == '') {
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
        const StaffMapper = MapperFactory.build(MapperFactory.STAFF);
        return StaffMapper.findDomainRecord({by, value})
            .then(result=> {
                return (Util.buildResponse({data: {items: result.records}}));
            });
    }

    /**
     *
     * @param body
     * @param who
     */
    createStaff(body = {}, who = {}) {
        const Staff = DomainFactory.build(DomainFactory.STAFF);
        body['api_instance_id'] = who.api;
        let staff = new Staff(body);
        //Get Mapper
        const StaffMapper = MapperFactory.build(MapperFactory.STAFF);
        // console.log(staff);
        return StaffMapper.createDomainRecord(staff).then(staff=> {
            if (!staff) return Promise.reject();
            return Util.buildResponse({data: staff});
        });
    }

    /**
     *
     * @param by
     * @param value
     * @returns {*}
     */
    deleteStaff(by = "id", value) {
        const StaffMapper = MapperFactory.build(MapperFactory.STAFF);
        return StaffMapper.deleteDomainRecord({by, value}).then(count=> {
            if (!count) {
                return Util.buildResponse({status: "fail", data: {message: "The specified record doesn't exist"}});
            }
            return Util.buildResponse({data: {message: "Staff deleted"}});
        });
    }
}

module.exports = StaffService;