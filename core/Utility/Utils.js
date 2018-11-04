/**
 * Created by paulex on 9/6/17.
 */
const DateUtils = require('./DateUtils');
const MapperUtils = require('./MapperUtil');
const crypto = require('crypto'), algorithm = 'aes192';
const _ = require("lodash");
let unitCounter = {};


module.exports = function Utils() {
};

module.exports.loadMapper = function (store = {}, path, key, context = null) {
    if (store[key]) {
        return store[key];
    }
    try {
        let mapper = require(path);
        if (mapper) {
            mapper = new mapper(context);
            key = (mapper.mapperName) ? mapper.mapperName : (mapper.domainName) ? mapper.domainName : key;
            if (key !== "" && key.trim().length > 0) store[key] = mapper;
        }
    } catch (e) {
        return;
    }
    return null;
};

String.prototype.ellipsize = function (limit = 50, suffix = "...") {
    return (this.length > limit) ? `${this.substring(0, limit)}${suffix}` : this.toString();
};

module.exports.random = function (length = 5) {
    return new Promise((resolve, reject) => {
        crypto.randomBytes(length, (err, buff) => {
            if (err) return reject(err);
            return resolve(buff.toString('hex'));
        });
    });
};

module.exports.encrypt = function (value, secret = "", algo = null) {
    const cipher = crypto.createCipher(algo || algorithm, secret);
    let crypted = cipher.update(value, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
};

module.exports.decrypt = function (value, secret = "") {
    const decipher = crypto.createDecipher(algorithm, secret);
    let dec = decipher.update(value, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
};


module.exports.getAssignees = function (assignedTo = [], db, cols = ["id", "username", "first_name", "last_name"]) {
    if (assignedTo === null) assignedTo = [];
    let filtered = assignedTo.filter(i => i.id);
    return db.table("users").whereIn("id", filtered.map(({id}) => id)).where("deleted_at", null).select(cols);
};

module.exports.getModels = function (db, table, argsObj = [], cols = [], key = "id") {
    let filtered = argsObj.filter(i => i[key]);
    return db.table(table).whereIn(key, filtered.map(({id}) => id)).where("deleted_at", null).select(cols);
};

module.exports.serializeAssignedTo = function (assignedTo = "[]") {
    let assigned_to = [];
    try {
        assignedTo = (Array.isArray(assignedTo)) ? assignedTo : JSON.parse(assignedTo);
        if (Array.isArray(assignedTo)) {
            assigned_to = assignedTo.map(t => {
                if (!Number.isNaN(t)) {
                    return {id: parseInt(t), created_at: this.date.dateToMysql()};
                } else {
                    //check if it is an object
                }
                return t;
            });
        }
        return JSON.stringify(assigned_to);
    } catch (e) {
        console.log(e);
    }
    return assigned_to;
};

module.exports.convertDataKeyToJson = function (data, ...keys) {
    keys.forEach(i => {
        if (!data[i]) return;
        let [isValid, json] = this.isJson(data[i]);
        if (isValid) data[i] = json;
    });
    return data;
};

module.exports.isJson = function (str) {
    if (typeof str !== "string" || `${str}`.length === 0) return [false, str];
    let json = "";
    let isValid = false;
    try {
        json = JSON.parse(str);
        isValid = true;
    } catch (e) {
        isValid = false
    }
    if (!json || typeof json !== "object") isValid = false;
    return [isValid, json]
};

module.exports.verifyRelatedSource = async function (db, domain) {
    if (domain.source && domain.source.toLowerCase() === "crm") {
        switch (domain.related_to) {
            case "assets": {
                let asset = await db.table(domain.related_to).where('id', domain.relation_id)
                    .orWhere('ext_code', domain.relation_id).select(['id', 'group_id']);
                asset = asset.shift();
                //Next lets find the OMC this fault should be related to
                //select from users innerJoin role where user.group_id = group_id and role.slug = omc
                if (asset) domain.relation_id = `${asset.id}`;
                else return false;
            }
        }
    }
    return true;
};

module.exports.updateAssigned = function (oldAssignee = [], newAssignee = []) {
    if (!Array.isArray(newAssignee)) newAssignee = JSON.parse(newAssignee);
    const filtered = [];
    for (let i = 0, len = newAssignee.length; i < len; i++) {
        let found = false, newItem = newAssignee[i];
        for (let j = 0; j < oldAssignee.length; j++) {
            if (parseInt(newItem.id) === oldAssignee[j]['id']) {
                found = true;
                filtered.push(oldAssignee[j]);
                break;
            }
        }
        if (!found) filtered.push(newItem);
    }
    //TODO return both the json object and the stringified
    return JSON.stringify(_.uniqBy(filtered, "id"));
};

module.exports.date = DateUtils;

module.exports.mapper = function () {
    return MapperUtils;
};

module.exports.validatePayLoad = function (payLoad, checks) {
    const pKeys = Object.keys(payLoad);
    let valid = true;
    let missing = [];
    let clientMessage = {};
    for (let i = 0; i < checks.length; i++) {
        const key = checks[i];
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
    const pKeys = Object.keys(payload);
    let guardedKeys = [];
    for (let i = 0; i < guarded.length; i++) {
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
                status: "fail",
                msg: "A related field value doesn't exist. Foreign key constraint",
                type: "Database",
                code: `${err.errno} - ${err.code}`,
                desc: "You are trying to insert a record that has relationship with " +
                "another entity of which the related entity doesn't exist"
            };
        case 1586:
            return {
                status: "fail",
                msg: "Duplicate Key value entry",
                type: "Database",
                code: `${err.code}`,
                desc: "There is a unique key constraint in one of the fields you are trying to insert."
            };
        case 1062://ER_DUP_ENTRY
            const _x = err.sqlMessage.split("'"), _d = _x[3].split("_");
            const _err = {
                status: "fail",
                type: "Database",
                code: `DUPLICATE_ENTRY`,
                field_name: _d[1],
                desc: `There is a unique key constraint in '${_d[1]}'.`
            };
            _err.msg = (_d.length === 3)
                ? `The ${_d[0].slice(0, -1)} ${_d[1]} '${_x[1]}' already exist.`
                : `The ${_x[3].replace(/_/g, " ").substring(0, _x[3].indexOf("unique") - 1)} already exist.`;
            return _err;
        case 1022://ER_DUP_KEY
            return {
                status: "fail",
                msg: "Duplicate Key value entry",
                type: "Database",
                code: `${err.errno} - ${err.code}`,
                desc: "There is a unique key constraint in one of the fields you are trying to insert."
            };
        case 1048:
            return {
                status: "fail",
                msg: "Cannot insert null",
                type: "Database",
                code: `${err.errno} - ${err.code}`,
                desc: "Null values are not allowed into one of the fields you want to update/add."
            };
        case 1216:
            return {
                status: "fail",
                msg: "The related field value doesn't exist. Foreign key constraint",
                type: "Database",
                code: `${err.errno} - ${err.code}`,
                desc: "You are trying to insert a record that have a relationship with " +
                "another entity of which the related entity doesn't exist"
            };
        case 1217:
            return {
                status: "fail",
                msg: "You can't delete this record because it has a related entity",
                type: "Database",
                code: `${err.errno} - ${err.code}`,
                desc: "You maybe need to delete its related entity before trying to delete this record"
            };
        case 1451:
            return {
                status: "fail",
                msg: "You can't delete this record because it has a related entity",
                type: "Database",
                code: `${err.errno} - ${err.code}`,
                desc: "You maybe need to delete its related entity before trying to delete this record"
            };
        default:
            console.log(err);
            return {
                status: "fail",
                msg: "You are doing something wrong",
                type: "Database",
                code: `${err.errno} - ${err.code}`,
                desc: "Properly check what you are inserting."
            }
    }
};

/**
 *
 * @param status
 * @param data
 * @param msg
 * @param type
 * @param code
 * @param desc
 * @param isRoute
 * @param statusCode
 * @returns {{data?:*, code?:*}}
 */
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
    const variables = [];
    keys.forEach((key, i) => {
        redis.get(key, (err, v) => {
            console.log(v);
            if (!err) variables.push(v);
        });
        if (i === (keys.length - 1)) return variables;
    });
};

module.exports.redisGet = function (redis, key, toJson = true) {
    return new Promise((resolve, reject) => {
        redis.get(key, (err, value) => {
            if (err) return reject(err);
            return (toJson) ? resolve(JSON.parse(value)) : resolve(value);
        });
    });
};

module.exports.getBUAndUT = function (group, groups) {
    if (!group) return [null, []];
    let bu, ut = [];
    const type = group.type.toLowerCase();
    const findUT = (item) => {
        if (!item) return;
        item.forEach(child => {
            if ("undertaking" === child.type.toLowerCase()) {
                if (child['parent']) delete child.parent;
                if (child['children']) delete child.children;
                return ut.push(child);
            } else {
                return findUT(groups[child.id]['children']);
            }
        });
    };
    try {
        if (type === "business_unit") {
            //downward movement
            bu = group;
            if (!bu.children) return [bu, []];
            const children = bu.children;
            if (bu['children']) delete bu.children;
            findUT(children);
        }
        else if (type === "undertaking") {
            //upward movement
            bu = this.getGroupParent(group, "business_unit");
            if (bu && bu.parent) delete bu.parent;
            if (bu && bu.children) delete bu.children;
        } else {
            bu = this.getGroupParent(group, "business_unit");
            let ut1 = this.getGroupParent(group, "undertaking");
            if (ut1) ut.push(ut1);
            findUT(group.children);
        }
    } catch (e) {
        console.log(e);
    }
    let businessUnit = {}, undertaking = [];
    Object.assign(businessUnit, bu);
    Object.assign(undertaking, ut);
    return [businessUnit, undertaking];
};


module.exports.validateEmail = function (email) {
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
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

/**
 * Retrieves all the nested children of a group
 *
 * @param group
 * @param gType
 * @returns {{children: Array, ids: any[]}}
 */
module.exports.getGroupChildren = function (group = {}, gType = null) {
    const {children = []} = group, myChildren = [];
    const loopChildren = (aChildren) => {
        for (let {id, name, type, short_name, children = []} of aChildren) {
            if (!gType || gType === type) myChildren.push({id, name, type, short_name});
            if (children.length) loopChildren(children);
        }
    };
    loopChildren(children);
    return {children: myChildren, ids: myChildren.map(({id}) => id)};
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
    const db = context.database;
    if (!unitCounter[unitName]) unitCounter[unitName] = 0;

    const executor = (resolve, reject) => {
        let resultSets = db.select([moduleName]).from('unit_counters').where('unit_name', unitName);
        return resultSets.then(results => {
            //if the result is empty we need to add the new counter
            let count = (results.length) ? results.shift()[moduleName] : 0;

            if (unitCounter[unitName] === 0) unitCounter[unitName] = count;

            if (!count) db.table('unit_counters').insert({"unit_name": unitName}).then(() => null);

            ++unitCounter[unitName];

            //Lets add this up
            db.table('unit_counters').update({[moduleName]: unitCounter[unitName]}).where('unit_name', unitName)
                .then(() => null);

            count = `${unitCounter[unitName]}`;
            let randomNo = Math.round(Math.random() * (999 - 100) + 100);
            const month = `${'0' + (new Date().getMonth() + 1)}`.slice(-2);
            generated = `${generated}${count.padStart(6, '0')}${randomNo}${month}`;
            // console.log(generated);
            return resolve(generated);
        }).catch(console.error);
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

module.exports.numericToInteger = function (body, ...keys) {
    let _oKeys = Object.keys(body);
    for (let i = 0; i < _oKeys.length; i++) {
        let key = _oKeys[i];
        if (body[key] && keys.includes(key)) {
            let value = Number(body[key]);
            if (isNaN(value)) continue;
            body[key] = value;
        }
    }
};

module.exports.spotDifferenceInRecord = function (newRecord = {}, oldRecord = {}) {
    let isDifferent = false;
    let changeSummary = [];
    for (let [key, value] of Object.entries(newRecord)) {
        let oldRecordValue = oldRecord[key];
        if ((oldRecordValue || oldRecordValue === "") && (oldRecordValue != value)) {
            //check for keys like assigned_to
            if (typeof oldRecordValue !== "object") {
                changeSummary.push(`${key}:${oldRecord[key]}__::::__${newRecord[key]}`);
                isDifferent = true;
            } else if (typeof oldRecordValue === 'object') {
                //We'd need to check this object

            }
        }
    }
    return [isDifferent, changeSummary];
};

module.exports.upsert = function (db, table, data, update) {
    if (!update) update = data;
    let insertSQL = db.insert(data).into(table).toString();
    let updateSQL = db.table(table).update(update).toString().replace(/^update .* set /i, '');
    console.log(db.raw(insertSQL + ' on duplicate key update ' + updateSQL).toString());
    return db.raw(insertSQL + ' on duplicate key update ' + updateSQL);
};

module.exports.upsertIncrement = function (db, table, data, cols = []) {
    let insertSQL = db.insert(data).into(table).toString();
    let updateSQL = cols.map(f => `${f}=${f}+${data[f]}`).join(",");

    updateSQL += `, updated_at='${this.date.dateToMysql()}'`;
    console.log(db.raw(insertSQL + ' on duplicate key update ' + updateSQL).toString());
    return db.raw(insertSQL + ' on duplicate key update ' + updateSQL);
};

/**
 *
 * @param context {Context}
 * @param key
 * @param toJson
 * @returns {Promise}
 */
module.exports.getFromPersistent = function (context, key, toJson = false) {
    return new Promise((resolve, reject) => {
        context.persistence.get(key, (err, value) => {
            if (err) return reject(err);
            return resolve((toJson) ? JSON.parse(value) : value)
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


module.exports.getModuleName = function (module) {
    switch (module) {
        case "disconnection_billings":
            return "Disconnection";
        case "payment_plans":
            return "Payment Plan";
        default:
            return "Module";
    }
};

module.exports.invokeInSequence = function (args, ...promises) {
    (async function () {
        for (let promise of promises) await promise.catch(console.error);
    })().catch(console.error);
};

module.exports.paymentPlanProcessed = function (appStatus) {
    if (appStatus !== 0) {
        return this.buildResponse({
            status: "fail",
            code: `${(appStatus === -1) ? "PAYMENT_PLAN_REJECTED" : "PAYMENT_PLAN_APPROVED"}`,
            msg: `This payment plan has already been worked on`
        }, 400);
    }
    return this.buildResponse({msg: "The current state of this payment plan is unknown."});
};

module.exports.planPeriod = (period) => {
    return period.replace(/[a-zA-Z]/g, (s) => {
        switch (s.toLowerCase()) {
            case "m":
                return " Month(s)";
            case "y":
                return " Year(s)";
            default:
                return "--"
        }
    });
};

module.exports.requestPromise = (options, method = 'GET', headers = {}) => {
    const request = require("request");
    const executor = (resolve, reject) => {

        switch (method.toUpperCase().trim()) {
            case 'POST':
                break;
            case 'GET':
                break;
            case 'PUT':
                break;
            case 'DELETE':
                break;
            default:
                throw new TypeError(`HttpMethod: ${method}, is not supported!.`)
        }
        console.log(options);
        request[method.toLowerCase()](options, (err, res, body) => {
            if (err || ![200, 201, 202].includes(res.statusCode)) {
                return reject(err || body);
            }
            return resolve(body || true);
        });

    };
    return new Promise(executor);
};

module.exports.customerHasPendingWorkOrder = async function (db, acctNo = "", tbl = "disconnection_billings") {
    const dis = await db.table(tbl).where("account_no", acctNo)
        .whereRaw('work_order_id IS NOT NULL')
        .orderBy('created_at', 'desc').limit(2)
        .catch(err => {
            console.error(err);
            return Promise.resolve(true);
        });
    const disc = dis.shift();

    if (!disc) return false;

    let wks = await db.table("work_orders").where("related_to", tbl).where("relation_id", disc.id).select(['status'])
        .catch(_ => (Promise.resolve(true)));
    return (wks.length && wks.shift().status <= 4);
};


module.exports.processMakerError = function (err) {
    if (!err.error) {
        return this.buildResponse({
            status: 'fail',
            msg: 'Connection Timed Out, Please try again later.',
            desc: "One of our servers can't be reached at this moment"
        }, 500);
    }
    const error = err.error;
    // console.log(err);
    if (!error) return "";
    const processMessage = (msg, obj) => {
        if (msg.includes("permission")) {
            obj.msg = "You don't have permission to act on this record";
            obj.code = "PM_ERROR_NO_PERMISSION";
            return obj;
        } else if (msg.includes("does not exist")) {
            obj.msg = "The record you are trying to access doesn't exist";
            obj.code = "PM_ERROR_NOT_FOUND";
            return obj;
        } else if (msg.includes("Unauthorized")) {
            obj.msg = "Unauthorized Access";
            obj.code = "PM_ERROR_UNAUTHORIZED";
            return obj;
        } else if (msg.includes("already exists")) {
            obj.msg = `The record ${msg.slice(msg.indexOf('"'), -1)}`;
            if (msg.includes("USR_USERNAME")) obj.data = {"username": [obj.msg]};
            obj.code = "VALIDATION_ERROR";
            return obj;
        } else if (msg.includes("user is not assigned")) {
            obj.msg = "You are currently not permitted to perform this action, because of your group. Please contact the system Administrator.";
            obj.code = "PM_ERROR_NOT_ASSIGNED";
            return obj;
        } else if (msg.includes("assigned to another user")) {
            obj.msg = "You are currently not permitted to perform this action. This task was assigned to a different user";
            obj.code = "PM_ERROR_NOT_ASSIGNED";
            return obj;
        }
    };
    switch (error.code) {
        case 400:
            return this.buildResponse(processMessage(error.message, {status: 'fail'}), 400);
        case 401:
            return this.buildResponse(processMessage(error.message, {status: 'fail'}), 401);
        default:
            return this.buildResponse(processMessage(error.message, {status: 'fail'}), 500);
    }
};


module.exports.getFaultStatus = function (key) {
    switch (key) {
        case '1':
            return "New";
        case '2':
            return "Assigned";
        case '3':
            return "Pending";
        case '4':
            return "Closed";
        default:
            return "/Unknown";
    }
};

module.exports.getFaultPriority = function (key) {
    switch (key) {
        case '0':
            return "Low";
        case '1':
            return "Medium";
        case '2':
            return "High";
        case '3':
            return "Urgent";
        default:
            return "/Unknown";
    }
};

module.exports.getWorkStatuses = function (type, key = null) {
    // console.log(type, key);
    //Assumptions of the type are 1: Disconnection, 2: Reconnection , 3: Faults
    if (!key && isNaN(type)) return [];
    if ((key && isNaN(type)) || isNaN(key)) return "/invalid-status";

    const status = {
        "1": {
            1: "New",
            2: "Assigned",
            3: "Disconnected",
            4: "Escalated",
            5: "Payment Received",
            6: "Closed",
            7: "Customer Already Paid",
            8: "Regulatory Issues"
        },
        "2": {
            1: "New",
            2: "Assigned",
            3: "Reconnected",
            4: "Escalated",
            5: "Closed"
        },
        "3": {
            1: "New",
            2: "Assigned",
            3: "Pending",
            4: "Closed"
        }
    };
    if (key !== null && status[type][key]) return status[type][key];
    else if (key !== null && !status[type][key]) return '/unknown';
    else if (type && status[type]) return status[type];
    else if (type && !status[type]) return [];
    else return ""
};


module.exports.getWorkPriorities = function (type, key = null) {
    if (!key && !isNaN(type)) return [];
    if (key && (!isNaN(type) || !isNaN(key))) return "/invalid-priority";

    const priorities = {
        1: {
            0: "Low",
            1: "Medium",
            2: "High",
            3: "Urgent"
        },
        2: {},
        3: {
            0: "Low",
            1: "Medium",
            2: "High",
            3: "Urgent"
        }
    };
    if (key !== null && priorities[type][key]) return priorities[type][key];
    else if (key !== null && !priorities[type][key]) return '/unknown';
    else if (type && priorities[type]) return priorities[type];
    else if (type && !priorities[type]) return [];
    else return ""
};