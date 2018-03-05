//noinspection JSUnresolvedFunction
const DomainObject = require('../../../../core/model/DomainObject');
//noinspection JSUnresolvedFunction
const map = require('./map.json');

/**
 * Created by paulex on 2/28/18.
 */

class Activation extends DomainObject {

    constructor(data) {
        super(data, map);
    }

    required() {
        return [
            'user_id',
            'code',
            'completed'
        ];
    }

    guard() {
        return [
            'id'
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
            user_id: 'int',
            code: String,
            'completed?': 'int'
        }
    }
}

module.exports = Activation;