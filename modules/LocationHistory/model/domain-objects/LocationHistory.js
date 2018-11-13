//noinspection JSUnresolvedFunction
const DomainObject = require('../../../../core/model/DomainObject');
//noinspection JSUnresolvedFunction
const map = require('./map.json');

/**
 * Created by paulex on 11/2/18.
 */

class LocationHistory extends DomainObject {

    constructor(data) {
        super(data, map);
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
            module: 'string|required',
            relation_id: 'required',
            location: 'required'
        }
    }

}

module.exports = LocationHistory;