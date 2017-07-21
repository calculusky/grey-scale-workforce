const DomainFactory = require('../../../DomainFactory');
const MapperFactory = require('../../../MapperFactory');
const Password = require('../../../../core/Utility/Password');
const Util = require('../../../../core/Utility/MapperUtil');
/**
 * @name DepartmentService
 * Created by paulex on 7/4/17.
 */
class DepartmentService {

    constructor() {

    }

    getName() {
        return "departmentService";
    }

    getDepartments(value, by = "id", who = {api: -1}) {
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
        const DepartmentMapper = MapperFactory.build(MapperFactory.DEPARTMENT);
        return DepartmentMapper.findDomainRecord({by, value}, offset, limit)
            .then(result=> {
                return (Util.buildResponse({data: {items: result.records}}));
            });
    }

    /**
     *
     * @param body
     * @param who
     */
    createDepartment(body = {}, who = {}) {
        const Department = DomainFactory.build(DomainFactory.DEPARTMENT);
        body['api_instance_id'] = who.api;
        let staff = new Department(body);
        //Get Mapper
        const DepartmentMapper = MapperFactory.build(MapperFactory.DEPARTMENT);
        return DepartmentMapper.createDomainRecord(staff).then(staff=> {
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
    deleteDepartment(by = "id", value) {
        const DepartmentMapper = MapperFactory.build(MapperFactory.DEPARTMENT);
        return DepartmentMapper.deleteDomainRecord({by, value}).then(count=> {
            if (!count) {
                return Util.buildResponse({status: "fail", data: {message: "The specified record doesn't exist"}});
            }
            return Util.buildResponse({data: {message: "Department deleted"}});
        });
    }


    getDepartmentManagers(value, by = "id") {
        //-- first we need to get the department the staff belongs to
        //-- iterate through the departments and get the corresponding manager for each
        //There is no straight bullet to this.. sadly
    }
}

module.exports = DepartmentService;