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
            'api_instance_id'
        ];
    }

    guard() {
        return [
            'id',
            'password',
            'email'
        ];
    }

    softDeletes() {
        return [
            false,
            "deleted",
            "deleted_at"
        ];
    }
}

//noinspection JSUnresolvedVariable
module.exports = User;