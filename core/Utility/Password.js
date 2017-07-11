/**
 * Created by paulex on 7/10/17.
 */

const crypto = require('crypto');
const pbkdf2Sync = crypto.pbkdf2Sync;

const defaultSalt = "generatedSalt";
const defaultIteration = 1000;

class Password {

    /**
     *
     * @param password
     * @param salt
     * @returns {{salt: string, hash: *, iterations: number}}
     */
    static encrypt(password, salt = defaultSalt) {
        return {
            salt,
            hash: pbkdf2Sync(password, salt, defaultIteration, 30, 'sha512').toString('hex'),
            iterations: defaultIteration
        };
    }

    /**
     * 
     * @param password
     * @param salt
     * @returns {*}
     */
    static decrypt(password, salt=defaultSalt) {
        return pbkdf2Sync(password, salt, defaultIteration, 30, 'sha512').toString('hex');
    }
}

module.exports = Password;