//noinspection JSUnresolvedFunction
const User = require('./User');

/**
 * @author Paul Okeke
 * Created by paulex on 21/01/19.
 * @name User
 */
class AuthUser extends User {

    constructor(data) {
        super(data);
        /*PLEASE DON'T PUT instance fields here that are not mapped to DB*/
    }

    required() {
        return [
            'username',
            'password',
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
            password: 'string|required',
            username: 'string|required',
        }
    }

    customErrorMessages() {
        return {
            required: 'The :attribute is required.'
        };
    }


    setPassword(password = "") {
        this._(this).data['password'] = password;
        this.password = password;
    }


    setUsername(username){
        this.username = username;
    }

    getUsername(){
        return this.username;
    }

    setUserId(id){
        this.id = id;
    }

    getUserId(){
        return this.id;
    }

    setGroups(...groupIds){
        this._groups = groupIds;
    }

    getGroups(){
        return this._groups || [];
    }

    setPermission(permission){
        this._permission = permission;
    }

    getPermission(){
        return this._permission;
    }

}

//noinspection JSUnresolvedVariable
module.exports = AuthUser;