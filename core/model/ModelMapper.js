/**
 * Created by paulex on 7/7/17.
 */
const DomainObject = require('./DomainObject');
const Util = require('../Utility/MapperUtil');
const Utils = require('../Utility/Utils');
const Log = require('../logger.js');
const DomainFactory = require('../../modules/DomainFactory');

/**
 * @name ModelMapper
 * This class should only be extended and not used directly
 */
class ModelMapper {

    constructor(context) {
        this.context = context;
        this.jsonFunction = {
            '->[]': 'JSON_CONTAINS'//check mysql implementation
        };

        this._(this).whereJson = (column, value, resultSets, domainObject)=> {
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
                            console.log(typeof value);
                            resultSets = resultSets.where(
                                this.context.database.raw(`${this.jsonFunction[keyName]}(${colName}, ${value})`)
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
        
        this._(this).buildWhere = (column, value = null, resultSets, domainObject)=> {
            if (!value) return resultSets;
            if (value && typeof value == 'object') {
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
    findDomainRecord({by=this.primaryKey, value, fields=["*"]}, offset = 0, limit = 10, orderBy = "created_at", order = "asc") {
        if (!by) throw new ReferenceError(`${this.constructor.name} must override the primary key field.`);
        if (by !== "*_all" && !value) throw new TypeError("The parameter value must be set for this operation");
        if (!this.tableName) throw new ReferenceError(`${this.constructor.name} must override the tableName field.`);


        const DomainObject = DomainFactory.build(this.domainName);
        let domainObject = new DomainObject();

        let resultSets = this.context.database
            .select(fields).from(this.tableName).limit(parseInt(limit)).offset(parseInt(offset))
            .orderBy(orderBy, order);
        //if this query is based on a condition:e.g where clause
        resultSets = this._(this).buildWhere(by, value, resultSets, domainObject);
        let executor = (resolve, reject)=> {
            resultSets
                .then(rows=> {
                    let domains = [];
                    for (let i = 0; i < rows.length; i++) {
                        let domain = new DomainObject(rows[i]);
                        domain.serialize(undefined, "client");
                        domains.push(domain);
                    }
                    return resolve({records: domains, query: resultSets.toString()});
                }).catch(err=> {
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
        if (domainObject) domainObjects.push(domainObject);

        //so there has to be a domain object
        if (!domainObjects.length && !(domainObjects[0] instanceof DomainObject))
            throw new TypeError("The parameter domainObject must be " + "an instance of DomainObject.");

        let validateErrors = [];
        let guardedErrors = [];

        let dbData = domainObjects.map(domain => {
            var [valid, , cMsg] = Util.validatePayLoad(domain, domain.required());
            if (!valid) validateErrors.push(cMsg);
            var [filteredDomain, guardedKeys] = Util.validateGuarded(domain, domain.guard());
            if (Object.keys(filteredDomain).length == 0) {
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
            const error = Util.buildResponse({status: "fail", data: validateErrors}, 400);
            return Promise.reject(error);
        }
        if (guardedErrors.length) {
            //TODO return error
        }
        let resultSets = this.context.database.insert(dbData).into(this.tableName);
        return resultSets.then(result => {
            //if this is a single insert lets return only the single object
            //to avoid problems from other services expecting just a single domainObject as a return value
            //services inserting multiples should however treat the result as an array
            let id = result.shift();
            if (domainObjects.length == 1) {
                domainObject = domainObjects.shift().serialize(dbData.shift(), 'client');
                domainObject.id = id;
            } else {
                domainObject = domainObjects.map(domain=> {
                    domain = domain.serialize(dbData.shift(), 'client');
                    domain.id = id++;
                    return domain;
                });
            }
            return Promise.resolve(domainObject);
        }).catch(err=> {
            Log.e('createDomainRecord', err);
            const error = Util.buildResponse(Util.getMysqlError(err), 400);
            return Promise.reject(error);
        });
    }

    /**
     * @param by
     * @param value
     * @param domain
     */
    updateDomainRecord({by = this.primaryKey, value, domain}) {
        if (!by) throw new ReferenceError(`${this.constructor.name} must override the primary key field.`);
        if (!this.tableName) throw new ReferenceError(`${this.constructor.name} must override the tableName field.`);
        if (by !== "*_all" && !value) throw new TypeError("The parameter value must be set for this operation");

        if (!(domain instanceof DomainObject)) throw new TypeError("The parameter domainObject must be " +
            "an instance of DomainObject.");

        var [filteredDomain, guardedKeys] = Util.validateGuarded(domain, domain.guard());

        if (Object.keys(filteredDomain).length == 0) {
            const error = Util.buildResponse({
                status: "fail", data: {
                    message: "Nothing to update. Some included fields are not allowed for update.",
                    guarded: guardedKeys
                }
            }, 400);
            return Promise.reject(error);
        }
        let updateData = filteredDomain.serialize(filteredDomain);

        let resultSets = this.context.database.table(this.tableName).update(updateData);

        if (by !== ModelMapper._all && by !== ModelMapper._andWhere) {
            resultSets = resultSets.where(domain.getTableColumn(by), value);
        } else if (by === ModelMapper._andWhere) {
            //TODO test that value is an object
            resultSets = resultSets.where(filteredDomain.serialize(value));
        }

        return resultSets
            .then(itemsUpdated=> {
                filteredDomain.serialize(updateData, "client");
                return Promise.resolve([filteredDomain, itemsUpdated]);
            })
            .catch(err=> {
                Log.e('updateDomainRecord', err);
                const error = Util.buildResponse(Util.getMysqlError(err), 400);
                return Promise.reject(error)
            });
    }


    /**
     * @param by
     * @param value
     */
    deleteDomainRecord({by = this.primaryKey, value}) {
        if (!by) throw new ReferenceError(`${this.constructor.name} must override the primary key field.`);
        if (!this.tableName) throw new ReferenceError(`${this.constructor.name} must override the tableName field.`);
        if (by !== "*_all" && !value) throw new TypeError("The parameter value must be set for this operation");
        //get the domainObject
        let DomainObject = DomainFactory.build(this.domainName);

        let domainObject = new DomainObject();
        var [softDelete, updateCol, dateDeletedCol] = domainObject.softDeletes();

        if (typeof softDelete === 'boolean' && softDelete) {
            domainObject[updateCol] = 1;
            domainObject[dateDeletedCol] = Utils.date.dateToMysql(new Date(), "YYYY-MM-DD H:m:s");
            return this.updateDomainRecord({by, value, domainObject});
        }

        let resultSets = this.context.database.table(this.tableName).delete();

        resultSets = this._(this).buildWhere(by, value, resultSets, domainObject);

        return resultSets
            .then(itemsDeleted=> {
                return Promise.resolve(itemsDeleted);
            })
            .catch(err=> {
                Log.e('deleteDomainRecord', err);
                const error = Util.buildResponse(Util.getMysqlError(err), 400);
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

ModelMapper._private_store = new WeakMap();
ModelMapper._all = "*_all";
ModelMapper._andWhere = "*_and";

module.exports = ModelMapper;