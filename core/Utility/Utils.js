/**
 * Created by paulex on 9/6/17.
 */
const DateUtils = require('./DateUtils');
const MapperUtils = require('./MapperUtil');
let unitCounter = {};


module.exports = function Utils() {
};

module.exports.date = DateUtils;

module.exports.mapper = function () {
    return MapperUtils;
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
        case 1586:
            return {
                status: "error",
                msg: "Duplicate Key value entry",
                type: "Database",
                code: `${err.code}`,
                desc: "There is a unique key constraint in one of the fields you are trying to insert."
            };
        case 1062:
            return {
                status: "error",
                msg: err.sqlMessage,
                type: "Database",
                code: `${err.code}`,
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
            return {
                status: "error",
                msg: "You are doing something wrong",
                type: "Database",
                code: `${err.errno} - ${err.code}`,
                desc: "Properly check what you are inserting."
            }
    }
};


module.exports.buildResponse = function ({status = "success", data, msg, type, code, desc, isRoute = true}, statusCode = 200) {
    let responseBody = {};
    responseBody.status = status;

    if (status !== "error" && data) responseBody.data = data;
    if (msg) responseBody.message = msg;
    if (type) responseBody.type = type;
    if (code) responseBody.code = code;
    if (desc) responseBody.description = desc;
    if (isRoute) {
        let response = {};
        if (status === "success") {
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

module.exports.jwtTokenErrorMsg = function (err) {
    console.log(err);
    switch (err.name) {
        case "JsonWebTokenError":
            return {
                message: "Unauthorized Access",
                description: "Unauthorized. Invalid Token Format",
                code: "INVALID_TOKEN"
            };
        case "TokenExpiredError":
            return {
                message: "Unauthorized Access",
                description: "Unauthorized. Token Expired",
                code: "TOKEN_EXPIRED"
            };
        default:
            return {
                message: "Unauthorized Access",
                description: "Unauthorized. Something went wrong with the token supplied",
                code: "UNKNOWN_TOKEN_ERROR"
            };
    }
};

module.exports.isMobile = function (userAgentFamily) {
    const isMobile = userAgentFamily.match(/Okhttp|okhttp|Android/);
    return (isMobile) ? isMobile.length : false;
};


module.exports.getAndSet = function (redis, keys) {
    let variables = [];
    keys.forEach((key, i) => {
        redis.get(key, (err, v) => {
            console.log(v);
            if (!err) variables.push(v);
        });
        if (i === (keys.length - 1)) return variables;
    });
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

module.exports.getGroupParent = function (group, type = 'business_unit') {
    if (group == null) return null;
    if (!type) return group.parent;
    if (group.type === type) return group;
    let tGroup;
    let parentGroup = tGroup = group.parent;
    do {
        if (!parentGroup) continue;
        if (parentGroup.type === type) {
            tGroup = parentGroup;
            break;
        }
        parentGroup = tGroup = parentGroup.parent;
    } while (parentGroup != null && parentGroup.type !== type);
    return (tGroup && tGroup.type === type) ? tGroup : null;
};

module.exports.generateUniqueSystemNumber = function (prefix, unitName, moduleName, context) {
    let generated = `${prefix}${unitName}`;

    if (!unitCounter[unitName]) unitCounter[unitName] = 0;

    const executor = (resolve, reject) => {
        let resultSets = context.database.select([moduleName]).from('unit_counters')
            .where('unit_name', unitName);


        resultSets.then(results => {
            //if the result is empty we need to add the new counter
            let count = (results.length) ? results.shift()[moduleName] : 0;

            if (unitCounter[unitName] === 0) unitCounter[unitName] = count;

            if (!count) context.database.table('unit_counters').insert({"unit_name": unitName}).then();

            ++unitCounter[unitName];

            //Lets add this up
            context.database.table('unit_counters').update({[moduleName]: unitCounter[unitName]})
                .where('unit_name', unitName).then();

            count = `${unitCounter[unitName]}`;
            let randomNo = Math.round(Math.random() * (999 - 100) + 100);
            generated = `${generated}${count.padStart(6, '0')}${randomNo}${new Date().getMonth() + 1}`;
            // console.log(generated);
            return resolve(generated);
        }).catch(t => {
            console.log(t);
        });
    };
    return new Promise(executor);
};

module.exports.humanizeUniqueSystemNumber = function (systemUniqueNo) {
    let formattedNo = "";
    let stringItems = systemUniqueNo.split("");
    for (let i = 0; i < stringItems.length; i++) {
        formattedNo += stringItems[i];
        if (i === 3 || i === 9 || i === 12) {
            formattedNo += "-";
        }
    }
    return formattedNo;
};

module.exports.isWorkOrderNo = function (workOrderNo) {
    if (!workOrderNo) return false;
    let firstChar = workOrderNo.substring(0, 1).toUpperCase();
    return firstChar === 'W' || firstChar === 'D' || firstChar === 'R';
};

/**
 *
 * @param context {Context}
 * @param key
 * @returns {Promise}
 */
module.exports.getFromPersistent = function (context, key) {
    return new Promise((resolve, reject) => {
        context.persistence.get(key, (err, value) => {
            if (err) return reject(err);
            return resolve(value)
        });
    });
};


//Report functions
module.exports.queryTimeType = function (time) {
    time = time.trim().toUpperCase();
    if (/^(\dW)|(\d{2}W)$/g.test(time) || /^([1-3])-([1-4])W$/g.test(time)) return 'W';
    else if (/TODAY/g.test(time)) return 'TODAY';
    else if (/MONTH/g.test(time)) return 'MONTH';
    else if (/YEAR/g.test(time)) return 'YEAR';
    else if (/^(\d{1,3}D)$/g.test(time) || /^(\d{1,2})-(\d{1,2})D$/g.test(time)) return 'D';
    else if (/^\dM$/g.test(time) || /^([1-9]|1[01])-([1-9]|1[012])M$/g.test(time)) return 'M';
    else if (/^\dY$/g.test(time) || /^(\d{4})-(\d{4})Y$/g.test(time)) return 'Y';
    else return null;
};