//noinspection JSUnresolvedFunction
const DomainObject = require('../../../../core/model/DomainObject');
//noinspection JSUnresolvedFunction
const map = require('./map.json');

/**
 * @author Paul Okeke
 * Created by paulex on 7/4/17.
 * @name Staff
 */
class Staff extends DomainObject {

    constructor(data) {
        super(data, map);
        /*PLEASE DON'T PUT instance fields here that are not mapped to DB*/
    }

    required() {
        return [
            'user_id',
            'emp_no',
            'birth_date'
        ];
    }

    guard() {
        return [
            'id',
            'password',
            'email'
        ];
    }

    softDeletes() {
        return [
            false,
            "deleted",
            "deleted_at"
        ];
    }

    rules() {
        return {
            user_id: Number,
            emp_no: String,
            birth_date: Date
        }
    }

    departments() {
        //A Staff has many departments
        return this.relations().belongsToMany('Department', 'staffs_departments', 'stf_id');
    }

    user() {
        return this.relations().hasOne('User');
    }
}

//noinspection JSUnresolvedVariable
module.exports = Staff;