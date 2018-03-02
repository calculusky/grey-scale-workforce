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
            'middle_name',
            'gender',
            'mobile_no'
        ];
    }

    guard() {
        return [
            'id',
            'roles'
        ];
    }

    softDeletes() {
        return [
            true,
            "deleted",
            "deleted_at"
        ];
    }

    rules() {
        return {
            email: 'email',
            password: String,
            gender: 'in(M, F, O)',
            mobile_no: 'numeric',
            username: String,
            'assigned_to?': Array
        }
    }


    async roles(){
        return this.relations().belongsToMany('Role', 'role_users', 'user_id', 'role_id');
    }
}

//noinspection JSUnresolvedVariable
module.exports = User;