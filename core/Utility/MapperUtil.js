/**
 * @author Okeke Paul
 * Created by paulex on 7/5/17.
 */

module.exports = function MapperUtil() {

};

module.exports.loadMapper = function (store = {}, path) {
    if (store[path]) {
        return store[path];
    }
    let mapper = require(path);
    if (mapper) {
        store[path] = new mapper();
    }
    return store[path];
};


module.exports.validatePayLoad = function (payLoad, checks) {
    var pKeys = Object.keys(payLoad);
    let valid = true;
    let missing = [];
    let clientMessage = {};
    for (var i = 0; i < checks.length; i++) {
        var key = checks[i];
        //if the payload doesn't have the required keys lets bounce the request
        if (!pKeys.includes(key) || (payLoad[key] == null || payLoad[key].toString().trim() === '')) {
            valid = false;
            missing.push(key);
            clientMessage[key] = `Missing required field '${key}'.`;
        }
    }
    return [valid, missing, clientMessage];
};


module.exports.validateGuarded = function (payload, guarded = []) {
    //guarded: check for keys that shouldn't be in the payload and remove
    var pKeys = Object.keys(payload);
    let guardedKeys = [];
    for (var i = 0; i < guarded.length; i++) {
        let key = guarded[i];
        if (pKeys.includes(key)) {
            guardedKeys.push(key);
            delete payload[key];
        }
    }
    return [payload, guardedKeys];
};

module.exports.getMysqlError = function (err) {
    switch (err.errno) {
        case 1452:
            return {
                status: "error",
                msg: "A related field value doesn't exist. Foreign key constraint",
                type: "Database",
                code: `${err.errno} - ${err.code}`,
                desc: "You are trying to insert a record that has relationship with " +
                "another entity of which the related entity doesn't exist"
            };
        case 1062:
            return {

            };
        case 1586:
            return {
                status: "error",
                msg: "Duplicate Key value entry",
                type: "Database",
                code: `${err.errno} - ${err.code}`,
                desc: "There is a unique key constraint in one of the fields you are trying to insert."
            };
        case 1022://ER_DUP_KEY
            return {
                status: "error",
                msg: "Duplicate Key value entry",
                type: "Database",
                code: `${err.errno} - ${err.code}`,
                desc: "There is a unique key constraint in one of the fields you are trying to insert."
            };

        case 1048:
            return {
                status: "error",
                msg: "Cannot insert null",
                type: "Database",
                code: `${err.errno} - ${err.code}`,
                desc: "Null values are not allowed into one of the fields you want to update/add."
            };
        case 1216:
            return {
                status: "error",
                msg: "The related field value doesn't exist. Foreign key constraint",
                type: "Database",
                code: `${err.errno} - ${err.code}`,
                desc: "You are trying to insert a record that have a relationship with " +
                "another entity of which the related entity doesn't exist"
            };
        case 1217:
            return {
                status: "error",
                msg: "You can't delete this record because it has a related entity",
                type: "Database",
                code: `${err.errno} - ${err.code}`,
                desc: "You maybe need to delete its related entity before trying to delete this record"
            };
        default:
            return{
                status: "error",
                msg: "You are doing something wrong",
                type: "Database",
                code: `${err.errno} - ${err.code}`,
                desc: "Properly check what you are inserting."
            }
    }
};

module.exports.buildResponse = function ({status="success", data, msg, type, code, desc, isRoute=true}, statusCode = 200) {
    let responseBody = {};
    responseBody.status = status;

    if (status !== "error" && data) responseBody.data = data;
    if (msg) responseBody.message = msg;
    if (type) responseBody.type = type;
    if (code) responseBody.code = code;
    if(desc) responseBody.description = desc;
    if (isRoute) {
        let response = {};
        if (status == "success") {
            response.data = responseBody;
            response.code = statusCode;
        } else {
            response.err = responseBody;
            response.code = statusCode;
        }
        return response;
    }
    return responseBody;
};

// module.exports.buildRouteResponse = function (err, code) {
//     return {err, code}
// };

module.exports.jwtTokenErrorMsg = function (err) {
    switch (err.name) {
        case "JsonWebTokenError":
            return "Unauthorized. Invalid Token Format";
        case "TokenExpiredError":
            return "Unauthorized. Token Expired";
        default:
            return "Unauthorized. Something went wrong with the token supplied";
    }
};


module.exports.validateEmail = function (email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
};


module.exports.authFailData = function (code) {
    switch (code) {
        case "AUTH_CRED":
            return {
                message: "Unauthorized",
                description: "The username or password is incorrect"
            };
    }
};