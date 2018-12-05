let MapperFactory = null;//require('../../../modules/MapperFactory');
const DomainFactory = require('../../../modules/DomainFactory');
const Log = require('../../logger.js');
const Context = require('../../Context');
const lodash = require('lodash');
let KNEX = null;

/**
 * @author Paul Okeke
 * @Date 7/20/17.
 * @name Relationships
 */
class Relationships {

    constructor(domain) {
        this.domainObject = domain;
        KNEX = Context.globalContext.database;
        MapperFactory = Context.globalContext.modelMappers;
    }

    /**
     * Many -to- Many Relationship
     *
     * @param relatedDomainMapper - The Domain or Model to be returned
     * @param tableName - The table that holds the relationship e.g roles_users
     * @param foreignPivotKey - The foreign key of the calling model as represented on the table {@param tableName}
     * @param relatedPivotKey - The foreign key that represents the model to be returned on {@param tableName}
     * @param parentKey - The primary or main key on the calling model/domain.
     * @param relatedKey
     * @param cols
     * @returns {Promise}
     */
    belongsToMany(relatedDomainMapper, tableName = null, foreignPivotKey = null, relatedPivotKey = null,
                  parentKey = null, relatedKey = null, cols = null) {
        //Get the domain mapper of the model that will be returned
        let DomainMapper = MapperFactory.build(relatedDomainMapper);
        if (!DomainMapper) throw new ReferenceError(`Domain Mapper for ${relatedDomainMapper} cannot be found.`);

        //Get the DomainObject for the domain we are retrieving.
        let DomainObject = DomainFactory.build(DomainMapper.domainName);
        if (!DomainObject)
            throw new ReferenceError(`Domain Object for ${DomainMapper.domainName} cannot be found.`);
        let domain = new DomainObject();

        let domainTable = DomainMapper.tableName;
        //TODO we should try guessing the foreignKey name
        //TODO if the tableName is null we can try guessing it as well
        tableName = (tableName) ? tableName : this.linkTable(domainTable);

        let primaryKey = (parentKey) ? parentKey : "id";//TODO get the primary key of this.domainObject
        let primaryKeyValue = this.domainObject[primaryKey];
        let tablePrimaryKey = domain.getTableColumn((relatedKey) ? relatedKey : DomainMapper.primaryKey);

        let columns = cols || [`${domainTable}.*`];

        let resultSets = KNEX.select(columns).from(domainTable)
            .innerJoin(tableName, function () {
                this.on(`${tableName}.${foreignPivotKey}`, KNEX.raw('?', [`${primaryKeyValue}`]))
                    .andOn(`${tableName}.${relatedPivotKey}`, `${domainTable}.${tablePrimaryKey}`)
            });

        let executor = (resolve, reject) => finalizeResult(resultSets, DomainObject, resolve, reject);
        return new Promise(executor);
    }

    /**
     * One - to - Many Relationship
     * @param domainMapperName
     * @param foreignKey
     * @param parentKey
     * @param cols
     * @param offset
     * @param limit
     * @param orderBy
     */
    hasMany(domainMapperName, foreignKey = `${domainMapperName.toLowerCase()}_id`,
            parentKey = "id", cols = ["*"], {offset = 0, limit = 10, orderBy = parentKey}) {
        let DomainMapper = MapperFactory.build(domainMapperName);
        if (!DomainMapper) throw new ReferenceError(`Domain Mapper for ${domainMapperName} cannot be found.`);

        //Get the DomainObject for the domain we are retrieving.
        let DomainObject = DomainFactory.build(DomainMapper.domainName);
        if (!DomainObject) throw new ReferenceError(`Domain Object for ${DomainMapper.domainName} cannot be found.`);

        const foreignDomain = new DomainObject();

        let foreignTable = DomainMapper.tableName;

        let resultSets = KNEX.select(cols).from(foreignTable).where(foreignKey, this.domainObject[parentKey]);

        const [softDelete, deleteCol] = foreignDomain.softDeletes();
        if (softDelete) resultSets.where(deleteCol, null);

        const executor = (resolve, reject) => finalizeResult(resultSets, DomainObject, resolve, reject);
        return new Promise(executor);
    }


    /**
     * An Inverse of One - to - One Relationship
     * @param domainMapperName
     * @param foreignKey
     * @param parentKey
     * @param cols
     */
    belongsTo(domainMapperName, foreignKey = `${domainMapperName.toLowerCase()}_id`, parentKey = "id", cols = ["*"]) {
        if (Array.isArray(parentKey)) {
            cols = parentKey;
            parentKey = "id";
        }

        let DomainMapper = MapperFactory.build(domainMapperName);
        if (!DomainMapper) {
            Log.e(`${this.constructor.name}:`, `Domain Mapper for ${domainMapperName} cannot be found.`);
            throw new ReferenceError(`Domain Mapper for ${domainMapperName} cannot be found.`);
        }

        //Get the DomainObject for the domain we are retrieving.
        let DomainObject = DomainFactory.build(DomainMapper.domainName);
        if (!DomainObject) {
            Log.e(`${this.constructor.name}:`, `Domain Object for ${DomainMapper.domainName} cannot be found.`);
            throw new ReferenceError(`Domain Object for ${DomainMapper.domainName} cannot be found.`);
        }

        let foreignTable = DomainMapper.tableName;


        if (!this.domainObject[foreignKey] || this.domainObject[foreignKey] === "") {
            console.log("no foreign key");
            return Promise.resolve({records: [{}]});
        }

        let resultSets = KNEX.select(cols).from(foreignTable)
            .where(parentKey, this.domainObject[foreignKey])
            .where(`${foreignTable}.deleted_at`, null);

        const executor = (resolve, reject) => finalizeResult(resultSets, DomainObject, resolve, reject);
        return new Promise(executor);
    }


    morphTo(modelNameColumn, modelIdColumn, cols = ['*']) {
        if (!this.domainObject[modelNameColumn] || !this.domainObject[modelIdColumn]) {
            throw new ReferenceError(`The columns[${modelNameColumn},${modelIdColumn}] 
            specified for morphTo relationship are not selected for 'this' domain object`);
        }

        //Because it is the table name that is saved, we have to convert it to
        //camel case format such that it matches our internal model/domain naming convention
        let relatedModelName = lodash.camelCase(this.domainObject[modelNameColumn]);

        relatedModelName = relatedModelName.replace(
            relatedModelName.substring(0, 1), relatedModelName.substring(0, 1).toUpperCase()
        );

        let DomainMapper = MapperFactory.build(relatedModelName);
        //The table name can either have an S at the end or probably doesn't

        DomainMapper = (!lodash.isEmpty(DomainMapper))
            ? DomainMapper
            : MapperFactory.build(relatedModelName.substring(0, relatedModelName.length - 1));

        if (!DomainMapper) throw new ReferenceError(`Domain Mapper for ${relatedModelName} cannot be found.`);

        let DomainObject = DomainFactory.build(DomainMapper.domainName);

        if (!DomainObject) {
            Log.e(`${this.constructor.name}:`, `Domain Object for ${DomainMapper.domainName} cannot be found.`);
            throw new ReferenceError(`Domain Object for ${DomainMapper.domainName} cannot be found.`);
        }

        let resultSets = KNEX.select(cols).from(DomainMapper.tableName)
            .where(DomainMapper.primaryKey, this.domainObject[modelIdColumn]);

        let executor = (resolve, reject) => finalizeResult(resultSets, DomainObject, resolve, reject);
        return new Promise(executor);
    }

    /**
     * Polymorphic Relationship
     *
     * @param domainMapperName
     * @param relatedDomainKey
     * @param foreignKey
     * @param options
     * @param cols
     * @returns {Promise}
     */
    morphMany(domainMapperName, relatedDomainKey, foreignKey = `${relatedDomainKey}_id`,
              options = {localDomain: `${this.domainObject.constructor.name}s`.toLocaleLowerCase(), localKey: "id"},
              cols = ['*']) {
        let DomainMapper = MapperFactory.build(domainMapperName);
        if (!DomainMapper) throw new ReferenceError(`Domain Mapper for ${domainMapperName} cannot be found.`);

        //Get the DomainObject for the domain we are retrieving.
        let DomainObject = DomainFactory.build(DomainMapper.domainName);

        if (!DomainObject) {
            console.log(`Domain Object for ${DomainMapper.domainName} cannot be found.`);
            throw new ReferenceError(`Domain Object for ${DomainMapper.domainName} cannot be found.`);
        }

        if (!this.domainObject[options.localKey] || this.domainObject[options.localKey] === "") {
            return Promise.resolve({records: [{}]});
        }

        let foreignTable = DomainMapper.tableName;

        let resultSets = KNEX.select(cols).from(foreignTable)
            .where(foreignKey, this.domainObject[options.localKey]).andWhere(relatedDomainKey, options.localDomain);

        if (options.orderBy) resultSets.orderBy(options.orderBy[0], options.orderBy[1]);
        if (options.limit) resultSets.limit(options.limit);

        const executor = (resolve, reject) => finalizeResult(resultSets, DomainObject, resolve, reject);
        return new Promise(executor);
    }


    linkTable(relatedTable) {
        let domains = [
            relatedTable,
            this.domainObject.constructor.name
        ];

        return domains.sort().join('_').toLowerCase();
    }

}

function finalizeResult(resultSets, DomainObject, resolve, reject) {
    resultSets.then(res => {
        let records = [], rowLen = res.length, processed = 0;
        for (let i = 0; i < rowLen; i++) {
            let domainObject = new DomainObject();
            domainObject.serialize(res[i], 'client');
            records.push(domainObject);
            if (++processed === rowLen) return resolve({records: records, query: resultSets.toString()});
        }
        if (0 === rowLen) return resolve({records: records, query: resultSets.toString()});
    }).catch(err => {
        return reject(err)
    });
}

module.exports = Relationships;