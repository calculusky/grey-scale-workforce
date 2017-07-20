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
}

//noinspection JSUnresolvedVariable
module.exports = Staff;