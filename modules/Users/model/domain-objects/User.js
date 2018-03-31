//noinspection JSUnresolvedFunction
const DomainObject = require('../../../../core/model/DomainObject');
//noinspection JSUnresolvedFunction
const map = require('./map.json');

/**
 * @author Paul Okeke
 * Created by paulex on 7/4/17.
 * @name User
 */
class User extends DomainObject {

    constructor(data) {
        super(data, map);
        /*PLEASE DON'T PUT instance fields here that are not mapped to DB*/
    }

    setPassword(password = "") {
        this._(this).data['password'] = password;
        this.password = password;
    }

    required() {
        return [
            'email',
            'username',
            'password',
            'first_name',
            'last_name',
            'gender',
            'mobile_no'
        ];
    }

    guard() {
        return [
            'id',
            'roles',
            'old_group_id',
            'user_group_id'
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
            email: 'email|required',
            password: 'string|required',
            gender: ['required', {'in': ['M', 'F', 'O']}],
            mobile_no: 'numeric|required',
            username: 'string|required',
            assigned_to: 'array'
        }
    }

    customErrorMessages() {
        return {
            required: 'The :attribute is required.'
        };
    }


    async roles() {
        return this.relations().belongsToMany('Role', 'role_users', 'user_id', 'role_id');
    }

    async userGroups() {
        return this.relations().belongsToMany('Group', 'user_groups', 'user_id', 'group_id');
    }

    async group() {

    }
}

//noinspection JSUnresolvedVariable
module.exports = User;