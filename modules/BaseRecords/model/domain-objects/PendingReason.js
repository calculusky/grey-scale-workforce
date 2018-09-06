//noinspection JSUnresolvedFunction
const DomainObject = require('../../../../core/model/DomainObject');
//noinspection JSUnresolvedFunction
const map = require('./pending.reason.map.json');

/**
 * @author Paul Okeke
 * Created by paulex on 8/30/18.
 * @name PendingReason
 */
class PendingReason extends DomainObject {

    constructor(data) {
        super(data, map);
        /*PLEASE DON'T PUT instance fields here that are not mapped to DB*/
    }

    required() {
        return [];
    }

    guard() {
        return [
            'api_instance_id',
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
            name: 'string|required'
        };
    }

}

//noinspection JSUnresolvedVariable
module.exports = PendingReason;