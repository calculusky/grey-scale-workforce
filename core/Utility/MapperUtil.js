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

module.exports.buildResponse = function ({status="success", data, msg, type, code, isRoute=true}, statusCode = 200) {
    let responseBody = {};
    responseBody.status = status;

    if (status !== "error" && data) responseBody.data = data;
    if (msg) responseBody.message = msg;
    if (type) responseBody.type = type;
    if (code) responseBody.code = code;
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