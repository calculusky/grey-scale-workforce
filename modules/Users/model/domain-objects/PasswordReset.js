//noinspection JSUnresolvedFunction
const DomainObject = require('../../../../core/model/DomainObject');
//noinspection JSUnresolvedFunction
const map = require('./password_reset.map.json');
const Password = require('../../../../core/Utility/Password');


/**
 * @author Paul Okeke
 * Created by paulex on 25/01/19.
 * @name PasswordReset
 */
class PasswordReset extends DomainObject {

    constructor(data) {
        super(data, map);
        /*PLEASE DON'T PUT instance fields here that are not mapped to DB*/
    }

    required() {
        return [
            'email'
        ];
    }

    guard() {
        return [
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
            email: 'email|required',
            password_confirmation: 'string|required|same:password',
            password: "string|required",
            token: "string|required"
        }
    }

    /**
     * Validates a password reset token
     *
     * @param db
     * @param email
     * @param token
     * @returns {Promise<*>}
     */
    async validateToken(db, email, token = this.token) {
        const reset = (await db.table("password_resets").where("email", email)).shift();
        if (!reset || !Password.equals(token, reset.token)) return false;
        db.table("password_resets").where("email", email).del().then();
        return true;
    }

}

//noinspection JSUnresolvedVariable
module.exports = PasswordReset;