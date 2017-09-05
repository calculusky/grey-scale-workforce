/**
 * Created by paulex on 7/10/17.
 */

const bcrypt = require('bcrypt');

const defaultSalt = 10;
const defaultIteration = 1000;
//because the users can be created from laravel and the password are mostly
//bcrypted with the prefix $2y$, nodeJs uses a different bcrypt $2a$, so to compare
//we have to replace $2y$ to fit in for bcrypt-node
const prefix = "$2a$";

class Password {

    /**
     *
     * @param password
     * @param salt
     * @returns {{salt: number, hash, iterations: number}}
     */
    static encrypt(password, salt = defaultSalt) {
        return {
            salt,
            hash: bcrypt.hashSync(password, salt),
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
        return bcrypt.hashSync(password, salt);
    }

    /**
     * Compares password
     * @param value
     * @param hash
     */
    static equals(value, hash){
        hash = hash.replace('$2y$', prefix);
        return bcrypt.compareSync(value, hash);
    }
}

module.exports = Password;