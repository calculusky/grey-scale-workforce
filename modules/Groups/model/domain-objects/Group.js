//noinspection JSUnresolvedFunction
const DomainObject = require('../../../../core/model/DomainObject');
//noinspection JSUnresolvedFunction
const map = require('./map.json');

/**
 * @author Paul Okeke
 * Created by paulex on 2/28/18.
 * @name Group
 */
class Group extends DomainObject {

    constructor(data) {
        super(data, map);
        /*PLEASE DON'T PUT instance fields here that are not mapped to DB*/
    }

    required() {
        return [
            'name',
            'type',
            'short_name'
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
            "deleted",
            "deleted_at"
        ];
    }

    rules() {
        return {
            name: 'string|required',
            short_name: 'string|required',
        };
    }


    user() {
        return this.relations().belongsTo("User", "assigned_to");
    }
}

//noinspection JSUnresolvedVariable
module.exports = Group;