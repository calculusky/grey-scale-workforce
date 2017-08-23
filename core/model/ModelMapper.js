/**
 * Created by paulex on 7/7/17.
 */
const KNEX = require('knex')({
    client: "mysql2", connection: {
        host: '127.0.0.1',
        user: 'root',
        password: 'Nigeriasns$1',
        database: 'mr_working'
    }
});

const DomainObject = require('./DomainObject');
const Util = require('../Utility/MapperUtil');
const Log = require('../logger.js');
const DomainFactory = require('../../modules/DomainFactory');

/**
 * @name ModelMapper
 * This class should only be extended and not used directly
 */
class ModelMapper {

    constructor(context) {
        this.context = context;
    }

    /**
     * Find a record from the table
     * @param by
     * @param value
     * @param fields
     * @param offset
     * @param limit
     */
    findDomainRecord({by=this.primaryKey, value, fields=["*"]}, offset = 0, limit = 10) {
        if (!by) throw new ReferenceError(`${this.constructor.name} must override the primary key field.`);
        if (by !== "*_all" && !value) throw new TypeError("The parameter value must be set for this operation");
        if (!this.tableName) throw new ReferenceError(`${this.constructor.name} must override the tableName field.`);


        const DomainObject = DomainFactory.build(this.domainName);
        let domainObject = new DomainObject();

        let resultSets = KNEX.select(fields).from(this.tableName).limit(parseInt(limit)).offset(parseInt(offset));
        //if this query is based on a condition:e.g where clause 
        if (by !== ModelMapper._all && by !== ModelMapper._andWhere) {
            resultSets = resultSets.where(domainObject.getTableColumn(by), value);
        } else if (by === ModelMapper._andWhere) {
            resultSets = resultSets.where(domainObject.serialize(value));
        }
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
     * Inserts a new record to {@link DomainObject.tableName}
     * @param domainObject - An instance of DomainObject
     * @returns {Promise.<DomainObject>|boolean}
     */
    createDomainRecord(domainObject = {}) {
        if (!(domainObject instanceof DomainObject)) throw new TypeError("The parameter domainObject must be " +
            "an instance of DomainObject.");

        let dbData = domainObject.serialize();

        //First check that the required fields are specified
        var [valid, , cMsg] = Util.validatePayLoad(domainObject, domainObject.required());
        

        if (!valid) {
            const error = Util.buildResponse({status: "fail", data: cMsg}, 400);
            return Promise.reject(error);
        }
        
        var [filteredDomain, guardedKeys] = Util.validateGuarded(domainObject, domainObject.guard());

        //Added on 21st august 2017 - Paul
        if (Object.keys(filteredDomain).length == 0) {
            const error = Util.buildResponse({
                status: "fail", data: {
                    message: "Nothing to update. Some included fields are not allowed for update.",
                    guarded: guardedKeys
                }
            }, 400);
            return Promise.reject(error);
        }
        dbData = filteredDomain.serialize(filteredDomain);

        let resultSets = KNEX.insert(dbData).into(this.tableName);
        return resultSets.then(result => {
            domainObject.serialize(dbData, "client");
            domainObject.id = result[0];
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

        let resultSets = KNEX.table(this.tableName).update(updateData);

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
            domainObject[dateDeletedCol] = Date.now();//TODO parse date to mysql date
            return this.updateDomainRecord({by, value, domainObject});
        }

        let resultSets = KNEX.table(this.tableName).delete();

        if (by !== ModelMapper._all && by !== ModelMapper._andWhere) {
            resultSets = resultSets.where(domainObject.getTableColumn(by), value);
        } else if (by === ModelMapper._andWhere) {
            //TODO test that value is an object
            resultSets = resultSets.where(domainObject.serialize(value));
        }

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