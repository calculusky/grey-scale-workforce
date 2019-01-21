/**
 * Created by paulex on 7/7/17.
 */
const DomainFactory = require('../../modules/DomainFactory');
const DomainObject = require('./DomainObject');
const Utils = require('../Utility/Utils');
const Log = require('../logger.js');
const AuditAble = require('../AuditAble');

/**
 * @author Paul Okeke
 * @name ModelMapper
 */
class ModelMapper {

    constructor(context) {
        this.context = context;
        this.jsonFunction = {
            '->[]': 'JSON_CONTAINS'//check mysql implementation
        };

        this._(this).whereJson = (column, value, resultSets, domainObject) => {
            //I think the process here can explain itself
            let fnKeys = Object.keys(this.jsonFunction);
            for (let i = 0; i < fnKeys.length; i++) {
                let keyName = fnKeys[i];
                if (column.includes(keyName)) {
                    column = column.replace(keyName, '');
                    let colName = domainObject.getTableColumn(column);
                    if (!colName) break;
                    switch (this.jsonFunction[keyName]) {
                        case 'JSON_CONTAINS':
                            resultSets = resultSets.where(
                                this.context.database
                                    .raw(`${this.jsonFunction[keyName]}(${this.tableName}.${colName}, ${value})`)
                            );
                            break;
                        case 'JSON_ARRAY_APPEND':
                            // resultSets = resultSets.where(
                            //     KNEX.raw(`${this.jsonFunction[keyName]}(${colName}, '$' ,${value})`)
                            // );
                            break;
                        default:
                    }
                    break;
                }
            }
            return resultSets;
        };

        this._(this).buildWhere = (column, value = null, resultSets, domainObject) => {
            if (!value) return resultSets;
            if (value && typeof value === 'object') {
                //it means we have got a lot of work to do here
                let colKeys = Object.keys(value);
                for (let i = 0; i < colKeys.length; i++) {
                    let col = colKeys[i], val = value[col];
                    //support for json columns
                    if (col.includes('->')) {
                        //check if its sent as a json quoted string or not
                        let isQuoted = val.substring(0, 1).indexOf("'") + 1;
                        val = (isQuoted) ? val : `'${val}'`;
                        resultSets = this._(this).whereJson(col, val, resultSets, domainObject);
                    } else {
                        resultSets = (domainObject.getTableColumn(col))
                            ? resultSets.where(domainObject.getTableColumn(col), val)
                            : resultSets;
                    }
                }
            } else {
                //if there are json expression in this column
                if (column.includes('->')) {
                    let isQuoted = value.substring(0, 1).indexOf("'") + 1;
                    value = (isQuoted) ? value : `'${value}'`;
                    //we need to look for the json function that matches this query
                    resultSets = this._(this).whereJson(column, value, resultSets, domainObject);
                } else {
                    resultSets = resultSets.where(domainObject.getTableColumn(column), value);
                }
            }
            return resultSets;
        };
    }

    /**
     * Find a record from the table
     * @param by
     * @param value
     * @param fields
     * @param offset
     * @param limit
     * @param orderBy
     * @param order
     */
    findDomainRecord({by = this.primaryKey, value, fields = ["*"]}, offset = 0, limit = 10, orderBy = "created_at", order = "asc") {
        if (!by) throw new ReferenceError(`${this.constructor.name} must override the primary key field.`);
        if (by !== "*_all" && !value) throw new TypeError("The parameter value must be set for this operation");
        if (!this.tableName) throw new ReferenceError(`${this.constructor.name} must override the tableName field.`);


        const DomainObject = DomainFactory.build(this.domainName);
        let domainObject = new DomainObject();

        let resultSets = this.context.database
            .select(fields).from(this.tableName).limit(parseInt(limit)).offset(parseInt(offset))
            .orderBy(orderBy, order);

        const [softDeleteEnabled, deletedAt] = domainObject.softDeletes() || [false];
        if (softDeleteEnabled) resultSets.where(deletedAt, null);

        //if this query is based on a condition:e.g where clause
        resultSets = this._(this).buildWhere(by, value, resultSets, domainObject);
        let executor = (resolve, reject) => {
            resultSets
                .then(rows => {
                    let domains = [];
                    for (let i = 0; i < rows.length; i++) {
                        let domain = new DomainObject(rows[i]);
                        domain.serialize(undefined, "client");
                        domains.push(domain);
                    }
                    return resolve({records: domains, query: resultSets.toString()});
                }).catch(err => {
                Log.e("findDomainRecord", err);
                return reject({err, query: resultSets.toString()});
            });
        };
        return new Promise(executor);
    }


    /**
     * TODO handle multiple inserts
     * Inserts a new record to {@link DomainObject.tableName}
     * @param domainObject - An instance of DomainObject
     * @param domainObjects
     * @returns {Promise.<DomainObject>|boolean}
     */
    createDomainRecord(domainObject = {}, domainObjects = []) {
        const DomainObject = DomainFactory.build(this.domainName);
        if (domainObject) domainObjects.push(domainObject);

        //so there has to be a domain object
        if (!domainObjects.length && !(domainObjects[0] instanceof DomainObject))
            throw new TypeError("The parameter domainObject must be " + "an instance of DomainObject.");

        let validateErrors = [];
        let guardedErrors = [];

        let dbData = domainObjects.map(domain => {
            let [valid, , cMsg] = Utils.validatePayLoad(domain, domain.required());
            if (!valid) validateErrors.push(cMsg);
            let [filteredDomain, guardedKeys] = Utils.validateGuarded(domain, domain.guard());
            if (Object.keys(filteredDomain).length === 0) {
                guardedErrors.push(guardedKeys);
            } else {
                let date = new Date();
                filteredDomain['created_at'] = Utils.date.dateToMysql(date, "YYYY-MM-DD H:m:s");
                filteredDomain['updated_at'] = Utils.date.dateToMysql(date, "YYYY-MM-DD H:m:s");
            }
            return filteredDomain.serialize(filteredDomain);
        });
        //Stoppers
        if (validateErrors.length) {
            const error = Utils.buildResponse({status: "fail", data: validateErrors}, 400);
            return Promise.reject(error);
        }
        if (guardedErrors.length) {
            //TODO return error
        }
        let resultSets = this.context.database.insert(dbData).into(this.tableName);
        return resultSets.then(result => {
            //if this is a single insert lets return only the single object
            //to avoid problems from other services expecting just a single domainObject as a return value.
            //services inserting multiples should however treat the result as an array
            let id = result.shift();
            if (domainObjects.length === 1) {
                domainObject = new DomainObject(domainObjects.shift().serialize(dbData.shift(), 'client'));
                domainObject.id = id;
            } else {
                domainObject = domainObjects.map(domain => {
                    domain = domain.serialize(dbData.shift(), 'client');
                    domain.id = id++;
                    return domain;
                });
            }

            //We can guess the user who is creating this record to make an audit
            const who = {sub: domainObject.created_by, group: [domainObject.group_id]};
            Array.isArray(domainObject)
                ? domainObject.forEach(e => onAudit(this, e, {sub: e.created_by, group: [e.group_id]}))
                : onAudit(this, domainObject, who);
            return Promise.resolve(domainObject);
        }).catch(err => {
            Log.e('createDomainRecord', err);
            const error = Utils.buildResponse({status: 'fail', data: Utils.getMysqlError(err)}, 400);
            return Promise.reject(error);
        });
    }

    /**
     * @param by
     * @param value
     * @param domain
     * @param who
     */
    updateDomainRecord({by = this.primaryKey, value, domain}, who = {}) {
        if (!by) throw new ReferenceError(`${this.constructor.name} must override the primary key field.`);
        if (!this.tableName) throw new ReferenceError(`${this.constructor.name} must override the tableName field.`);
        if (by !== "*_all" && !value) throw new TypeError("The parameter value must be set for this operation");

        if (!(domain instanceof DomainObject)) throw new TypeError("The parameter domainObject must be " +
            "an instance of DomainObject.");

        let [filteredDomain, guardedKeys] = Utils.validateGuarded(domain, domain.guard());

        if (Object.keys(filteredDomain).length === 0) {
            const error = Utils.buildResponse({
                status: "fail", data: {
                    message: "Nothing to update. Some included fields are not allowed for update.",
                    guarded: guardedKeys
                }
            }, 400);
            return Promise.reject(error);
        }
        let updateData = filteredDomain.serialize(filteredDomain);
        updateData.updated_at = Utils.date.dateToMysql();

        let resultSets = this.context.database.table(this.tableName).update(updateData);

        if (by !== ModelMapper._all && by !== ModelMapper._andWhere) {
            resultSets = resultSets.where(domain.getTableColumn(by), value);
        } else if (by === ModelMapper._andWhere) {
            //TODO test that value is an object
            resultSets = resultSets.where(filteredDomain.serialize(value));
        }
        const [softDeleteEnabled, deletedAt] = domain.softDeletes() || [false];
        if (softDeleteEnabled) resultSets.where(deletedAt, null);

        return resultSets
            .then(itemsUpdated => {
                updateData[by] = value;
                filteredDomain.serialize(updateData, "client");
                onAudit(this, filteredDomain, who, updateData[`${deletedAt}`] ? "DELETE" : "UPDATE");
                return Promise.resolve([filteredDomain, itemsUpdated]);
            })
            .catch(err => {
                Log.e('updateDomainRecord', err);
                const error = Utils.buildResponse({status: 'fail', data: Utils.getMysqlError(err)}, 400);
                return Promise.reject(error)
            });
    }


    /**
     * @param by
     * @param value
     * @param immediate - Determines if the returned promise should be triggered immediately
     * @param who
     */
    deleteDomainRecord({by = this.primaryKey, value}, immediate = true, who = {}) {
        if (!by) throw new ReferenceError(`${this.constructor.name} must override the primary key field.`);
        if (!this.tableName) throw new ReferenceError(`${this.constructor.name} must override the tableName field.`);
        if (by !== "*_all" && !value) throw new TypeError("The parameter value must be set for this operation");
        //get the domainObject
        let DomainObject = DomainFactory.build(this.domainName);

        let domainObject = new DomainObject();
        let [softDelete, dateDeletedCol, deletedByCol] = domainObject.softDeletes();

        if (typeof softDelete === 'boolean' && softDelete) {
            domainObject[dateDeletedCol] = Utils.date.dateToMysql();
            if (deletedByCol && who.sub) domainObject[deletedByCol] = who.sub;
            return this.updateDomainRecord({by, value, domain: domainObject}, who);
        }

        let resultSets = this.context.database.table(this.tableName).delete();

        resultSets = this._(this).buildWhere(by, value, resultSets, domainObject);
        if (!immediate) return resultSets;
        return resultSets
            .then(itemsDeleted => {
                onAudit(this, domainObject, who, "DELETE");
                return Promise.resolve(itemsDeleted);
            })
            .catch(err => {
                Log.e('deleteDomainRecord', err);
                const error = Utils.buildResponse({status: 'fail', data: Utils.getMysqlError(err)}, 400);
                return Promise.reject(error)
            });
    }

    /**
     * Sub-classes MUST override this method and return
     * the Domain Object the primarily work with
     * @returns {null}
     * @private
     */
    _getDomainObject() {
        return null;
    }

    /**
     * Store private fields with this method
     * @param instance
     * @returns {V}
     * @private
     */
    _(instance) {
        let store = ModelMapper._private_store.get(instance);
        if (!store) {
            store = {};
            ModelMapper._private_store.set(instance, store);
        }
        return store;
    }

}

/**
 *
 * @param mapper
 * @param action {String}
 * @param domain {DomainObject}
 * @param who
 */
function onAudit(mapper, domain, who, action = "CREATE") {
    if ((domain instanceof DomainObject) && domain.isAuditAble()) {
        AuditAble.getInstance().audit(mapper, domain, who, action);
    }
}

ModelMapper._private_store = new WeakMap();
ModelMapper._all = "*_all";
ModelMapper._andWhere = "*_and";

module.exports = ModelMapper;