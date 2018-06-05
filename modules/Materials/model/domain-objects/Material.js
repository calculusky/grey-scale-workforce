//noinspection JSUnresolvedFunction
const DomainObject = require('../../../../core/model/DomainObject');
//noinspection JSUnresolvedFunction
const map = require('./map.json');

/**
 * @author Paul Okeke
 * Created by paulex on 06/02/18.
 * @name Asset
 */
class Asset extends DomainObject {

    constructor(data) {
        super(data, map);
        /*PLEASE DON'T PUT instance fields here that are not mapped to DB*/
    }

    required() {
        return [
            'name',
            'unit_of_measurement'
        ];
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
            name: 'string|required',
            unit_of_measurement: "numeric|required"
        };
    }


    user() {
        return this.relations().belongsTo("User", "assigned_to");
    }
}

//noinspection JSUnresolvedVariable
module.exports = Asset;