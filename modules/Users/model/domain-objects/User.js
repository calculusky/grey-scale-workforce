//noinspection JSUnresolvedFunction
const DomainObject = require('../../../../core/model/DomainObject');
//noinspection JSUnresolvedFunction
const map = require('./map.json');
const Password = require('../../../../core/Utility/Password');
const Utils = require('../../../../core/Utility/Utils');


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
            'email',
            'group_id',
            'old_group_id',
            'user_group_id'
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
            email: 'email|required',
            first_name: 'required|string',
            last_name: 'required|string',
            password: 'string|required',
            gender: ['required', {'in': ['M', 'F', 'O']}],
            mobile_no: 'numeric|required',
            username: 'string|required',
            assigned_to: 'string|required'
        }
    }

    customErrorMessages() {
        return {
            required: 'The :attribute is required.'
        };
    }

    /**
     *
     * @returns {User}
     */
    encryptPassword() {
        if (this.password && this.password.trim() !== "") {
            this.wf_user_pass = Utils.encrypt(this.password, process.env.JWT_SECRET);
            //replace the password prefix as well for laravel's sake
            this.setPassword(Password.encrypt(this.password).hash.replace("$2a$", "$2y$"));
        }
        return this;
    }


    async roles() {
        return this.relations().belongsToMany('Role', 'role_users', 'user_id', 'role_id');
    }

    async userGroups() {
        return this.relations().belongsToMany('Group', 'user_groups', 'user_id', 'group_id');
    }

    async group() {

    }

    async locationHistory() {
        const options = {localDomain: "users", localKey: "id", orderBy: ["id", "desc"], limit: 20};
        return this.relations().morphMany("LocationHistory", "module", "relation_id", options);
    }

    async attachments(cols, offset = 0, limit = 10) {
        return this.relations().hasMany("Attachment", 'created_by', 'id', cols, {offset, limit});
    }
}

//noinspection JSUnresolvedVariable
module.exports = User;