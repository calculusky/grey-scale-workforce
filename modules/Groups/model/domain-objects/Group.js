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
            true,
            "deleted_at"
        ];
    }

    rules() {
        return {
            name: 'string|required',
            short_name: 'string|required',
        };
    }

    /**
     *
     * @param cols
     * @returns {Promise}
     */
    users(cols = ["id", "username", "first_name", "last_name", "gender", "email", "avatar"]) {
        return this.relations().belongsToMany("User", "user_groups", "group_id", "user_id", null, null, cols);
    }
}

//noinspection JSUnresolvedVariable
module.exports = Group;