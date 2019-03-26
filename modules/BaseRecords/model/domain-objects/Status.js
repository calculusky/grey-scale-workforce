//noinspection JSUnresolvedFunction
const DomainObject = require('../../../../core/model/DomainObject');
//noinspection JSUnresolvedFunction
const map = require('./status.map.json');

/**
 * @author Paul Okeke
 * Created by paulex on 3/26/19.
 * @name Status
 */
class Status extends DomainObject {

    constructor(data) {
        super(data, map);
        /*PLEASE DON'T PUT instance fields here that are not mapped to DB*/
    }

    required() {
        return [];
    }

    guard() {
        return [
            'id'
        ];
    }

    softDeletes() {
        return [
            false,
            "deleted_at"
        ];
    }

    rules() {
        return {
            name: 'string|required',
            type: 'string|required|in:DW,FW,F',
            parent_id: 'number',
            comments:'string-array'
        };
    }

    isAuditAble() {
        return false;
    }

}

//noinspection JSUnresolvedVariable
module.exports = Status;