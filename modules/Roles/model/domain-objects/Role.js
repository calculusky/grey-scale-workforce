//noinspection JSUnresolvedFunction
const DomainObject = require('../../../../core/model/DomainObject');
//noinspection JSUnresolvedFunction
const map = require('./map.json');

/**
 * @author Paul Okeke
 * Created by paulex on 2/28/18.
 * @name Role
 */
class Role extends DomainObject {

    constructor(data) {
        super(data, map);
        /*PLEASE DON'T PUT instance fields here that are not mapped to DB*/
    }

    required() {
        return [
            'name',
            'slug',
            'permissions'
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
            slug: 'string|required',
            permissions: 'string|required',
        };
    }


    user() {
        return this.relations().belongsTo("User", "assigned_to");
    }

    //Gets all the users that belongs this ROLE
    users(){
        return this.relations().belongsToMany("User", "role_users", "role_id", "user_id")
    }
}

//noinspection JSUnresolvedVariable
module.exports = Role;