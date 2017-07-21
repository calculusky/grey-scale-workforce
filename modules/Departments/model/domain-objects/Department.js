//noinspection JSUnresolvedFunction
const DomainObject = require('../../../../core/model/DomainObject');
//noinspection JSUnresolvedFunction
const map = require('./map.json');

/**
 * @author Paul Okeke
 * Created by paulex on 7/4/17.
 * @name Department
 */
class Department extends DomainObject {

    constructor(data) {
        super(data, map);
        /*PLEASE DON'T PUT instance fields here that are not mapped to DB*/
    }

    required() {
        return [
            'name',
            'api_instance_id'
        ];
    }

    guard() {
        return [
            'api_instance_id'
        ];
    }

    softDeletes() {
        return [
            false,
            "deleted",
            "deleted_at"
        ];
    }
    
    staffs(){
        return this.relations().belongsToMany("Staff", "staffs_departments", "dpt_id");
    }
    
    managers(){
        return this.relations().belongsToMany('Staff', 'departments_manager', 'dpt_id');
    }
}

//noinspection JSUnresolvedVariable
module.exports = Department;