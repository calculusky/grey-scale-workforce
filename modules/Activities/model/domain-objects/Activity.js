//noinspection JSUnresolvedFunction
const DomainObject = require('../../../../core/model/DomainObject');
//noinspection JSUnresolvedFunction
const map = require('./map.json');

/**
 * Created by paulex on 8/08/18.
 */

class Activity extends DomainObject {

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
            activity_type: 'required',
            activity_by: 'integer|required',
            description: 'string|required'
        }
    }

    isAuditAble(){
        return false;
    }

    activityBy(...cols) {
        if (cols.length === 0) cols[0] = "*";
        return this.relations().belongsTo("User", "activity_by", cols);
    }
}

module.exports = Activity;