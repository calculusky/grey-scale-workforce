const DomainFactory = require('../../../DomainFactory');
const MapperFactory = require('../../../MapperFactory');
const Password = require('../../../../core/Utility/Password');
const Util = require('../../../../core/Utility/MapperUtil');
const validate = require('validate-fields')();
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

    getStaffs(value, by = "id", who = {api: -1}, offset, limit) {
        if (!value || "" + value + "".trim() == '') {
            //Its important that all queries are streamlined majorly for each business
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
        return StaffMapper.findDomainRecord({by, value}, offset, limit)
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

        //enforce the validation
        let isValid = validate(staff.rules(), staff);
        if(!isValid){
            return Promise.reject(Util.buildResponse({status: "fail", data: {message: validate.lastError}}, 400));
        }
        
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


    getStaffDepartments(value, by = "id", who, offset, limit) {
        let executor = (resolve, reject)=> {
            this.getStaffs(value, by, who, offset, limit)
                .then(results=> {
                    //now lets get the department of each staff
                    let staffs = results.data.data.items;

                    if (!staffs.length) return (Util.buildResponse({data: {items: []}}));

                    let rowLen = staffs.length;
                    let processed = 0;
                    let items = [];

                    staffs.forEach(staff=> {
                        staff.departments().then(departments=> {
                            items.push({
                                staff_id: staff.id,
                                emp_no: staff.emp_no,
                                departments: departments.records
                            });
                            if (++processed == rowLen) return resolve(Util.buildResponse({data: {items}}));
                        }).catch(err=> {
                            return reject(err);
                        });
                    });
                    if (0 === rowLen) return resolve(Util.buildResponse({data: {items}}));
                }).catch(err=> {
                return reject(err);
            });
        };
        return new Promise(executor);
    }

    getStaffManagers(value, by = "id", who, offset, limit) {
        let executor = (resolve, reject)=> {
            this.getStaffs(value, by, who, offset, limit)
                .then(results=> {
                    //now lets get the department of each staff
                    const staffs = results.data.data.items;

                    if (!staffs.length) return (Util.buildResponse({data: {items: []}}));

                    const rowLen = staffs.length;
                    let processed = 0;
                    const items = [];

                    let departments = [];
                    for (let i = 0; i < staffs.length; i++) {
                        let staff = staffs[i];
                        staff.departments().then(depts=> {
                            departments = depts.records;
                            departments.forEach(dept=> {
                                fetchManagers(staff, dept);
                            });
                            //if this staff doesn't belong to any department lets return something empty
                            if(!departments.length) return (Util.buildResponse({data: {items}}));
                        });
                    }
                    const fetchManagers = (staff, department) => {
                        const manager = {
                            staff_id: staff.id,
                            managers: []
                        };
                        department.managers().then(mgrs=> {
                            manager.managers = mgrs.records;
                            manager.managers.forEach(manager=> {
                                manager.department = department;
                            });
                            items.push(manager);
                            if (++processed == rowLen) return resolve(Util.buildResponse({data: {items}}));
                        }).catch(e=>reject(e));
                    };
                    if (0 === rowLen) return resolve(Util.buildResponse({data: {items}}));
                }).catch(err=> {
                return reject(err);
            });
        };
        return new Promise(executor);
    }
}

module.exports = StaffService;