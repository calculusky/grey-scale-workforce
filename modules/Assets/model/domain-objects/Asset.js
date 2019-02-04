//noinspection JSUnresolvedFunction
const DomainObject = require('../../../../core/model/DomainObject');
//noinspection JSUnresolvedFunction
const map = require('./map.json');

/**
 * @author Paul Okeke
 * Created by paulex on 8/22/17.
 * @name Asset
 */
class Asset extends DomainObject {

    constructor(data) {
        super(data, map);
        /*PLEASE DON'T PUT instance fields here that are not mapped to DB*/
    }

    required() {
        return [
            'asset_name',
            'asset_type',
            'serial_no'
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
            "deleted_at"
        ];
    }

    rules() {
        return {
            asset_name: 'string|required',
            asset_type: "numeric|required",
            serial_no: "string|required",
            state: 'boolean',
            status: 'boolean'
        };
    }


    user() {
        return this.relations().belongsTo("User", "assigned_to");
    }

    faults(cols = ["*"]) {
        return this.relations().morphMany("Fault", "related_to", "relation_id", undefined, cols);
    }
}

//noinspection JSUnresolvedVariable
module.exports = Asset;