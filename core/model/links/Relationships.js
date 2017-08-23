const MapperFactory = require('../../../modules/MapperFactory');
const DomainFactory = require('../../../modules/DomainFactory');

const KNEX = require('knex')({
    client: "mysql2", connection: {
        host: '127.0.0.1',
        user: 'root',
        password: 'Nigeriasns$1',
        database: 'mr_working'
    }
});

/**
 * @author Paul Okeke
 * @Date 7/20/17.
 * @name Relationships
 */
class Relationships {

    constructor(domain) {
        this.domainObject = domain;
    }

    /**
     * Many -to- Many Relationship
     *
     * @param relatedDomainMapper
     * @param tableName
     * @param foreignKey
     * @param localKey
     * @returns {Promise}
     */
    belongsToMany(relatedDomainMapper, tableName = null, foreignKey = null, localKey = "id") {
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

        let primaryKey = (DomainMapper.primaryKey) ? DomainMapper.primaryKey : localKey;
        let primaryKeyValue = this.domainObject[primaryKey];
        let tablePrimaryKey = domain.getTableColumn(primaryKey);

        let columns = [`${domainTable}.*`];

        let resultSets = KNEX.select(columns).from(domainTable)
            .innerJoin(tableName, function () {
                this.on(`${tableName}.${foreignKey}`, KNEX.raw('?', [`${primaryKeyValue}`]))
                    .andOn(`${tableName}.${tablePrimaryKey}`, `${domainTable}.${tablePrimaryKey}`)
            });

        let executor = (resolve, reject)=> {
            resultSets.then(res=> {
                let records = [];
                let rowLen = res.length;
                let processed = 0;
                for (let i = 0; i < rowLen; i++) {
                    let domainObject = new DomainObject();
                    domainObject.serialize(res[i], 'client');
                    records.push(domainObject);
                    if (++processed === rowLen) return resolve({records: records, query: resultSets.toString()});
                }
                if (0 === rowLen) return resolve(records);
            }).catch(err=> {
                return reject(err);
            });
        };
        return new Promise(executor);
    }

    /**
     * One - to - One Relationship
     * @param domainMapperName
     * @param localKey - The
     * @param foreignKey
     */
    hasOne(domainMapperName, foreignKey = `${domainMapperName.toLowerCase()}_id`) {
        let DomainMapper = MapperFactory.build(domainMapperName);
        if (!DomainMapper) throw new ReferenceError(`Domain Mapper for ${domainMapperName} cannot be found.`);

        //Get the DomainObject for the domain we are retrieving.
        let DomainObject = DomainFactory.build(DomainMapper.domainName);
        if (!DomainObject)
            throw new ReferenceError(`Domain Object for ${DomainMapper.domainName} cannot be found.`);
        let foreignDomain = new DomainObject();

        let foreignTable = DomainMapper.tableName;
    }


    /**
     * An Inverse of One - to - One Relationship
     * @param domainMapperName
     * @param foreignKey
     * @param parentKey
     */
    belongsTo(domainMapperName, foreignKey = `${domainMapperName.toLowerCase()}_id`, parentKey = "id") {
        let DomainMapper = MapperFactory.build(domainMapperName);
        if (!DomainMapper) throw new ReferenceError(`Domain Mapper for ${domainMapperName} cannot be found.`);

        //Get the DomainObject for the domain we are retrieving.
        let DomainObject = DomainFactory.build(DomainMapper.domainName);
        if (!DomainObject){
            console.log(`Domain Object for ${DomainMapper.domainName} cannot be found.`);
            throw new ReferenceError(`Domain Object for ${DomainMapper.domainName} cannot be found.`);
        }

        let foreignTable = DomainMapper.tableName;

        
        if(!this.domainObject[foreignKey] || this.domainObject[foreignKey]==""){
            return Promise.resolve({records:[{}]});
        }

        let resultSets = KNEX.select(['*']).from(foreignTable).where(parentKey, this.domainObject[foreignKey]);

        var executor = (resolve, reject)=> {
            resultSets.then(res => {
                let records = [], rowLen = res.length, processed = 0;
                for (let i = 0; i < rowLen; i++) {
                    let domainObject = new DomainObject();
                    domainObject.serialize(res[i], 'client');
                    records.push(domainObject);
                    if (++processed === rowLen) return resolve({records: records, query: resultSets.toString()});
                }
                if (0 === rowLen) return resolve(records);
            }).catch(err=> {
                console.log(err);
                return reject(err)
            })
        };
        return new Promise(executor)
    }


    morphTo(){

    }

    /**
     * Polymorphic Relationship
     * 
     * @param domainMapperName
     * @param relatedDomainKey
     * @param foreignKey
     * @param options
     * @returns {Promise}
     */
    morphMany(domainMapperName, relatedDomainKey, foreignKey=`${relatedDomainKey}_id`, 
              options={localDomain:`${this.domainObject.constructor.name}s`.toLocaleLowerCase(), localKey:"id"}){
        
        let DomainMapper = MapperFactory.build(domainMapperName);
        if (!DomainMapper) throw new ReferenceError(`Domain Mapper for ${domainMapperName} cannot be found.`);

        //Get the DomainObject for the domain we are retrieving.
        let DomainObject = DomainFactory.build(DomainMapper.domainName);
        
        if (!DomainObject){
            console.log(`Domain Object for ${DomainMapper.domainName} cannot be found.`);
            throw new ReferenceError(`Domain Object for ${DomainMapper.domainName} cannot be found.`);
        }

        if(!this.domainObject[options.localKey] || this.domainObject[options.localKey]==""){
            return Promise.resolve({records:[{}]});
        }

        let foreignTable = DomainMapper.tableName;

        let resultSets = KNEX.select(['*']).from(foreignTable)
            .where(foreignKey, this.domainObject[options.localKey]).andWhere(relatedDomainKey, options.localDomain);

        var executor = (resolve, reject)=>{
            resultSets.then(res=>{
                let records = [], rowLen = res.length, processed = 0;
                for (let i = 0; i < rowLen; i++) {
                    let domainObject = new DomainObject();
                    domainObject.serialize(res[i], 'client');
                    records.push(domainObject);
                    if (++processed === rowLen) return resolve({records: records, query: resultSets.toString()});
                }
                if (0 === rowLen) return resolve({records: records, query: resultSets.toString()});
            }).catch(err=>{
                return reject(err)
            });
        };
        return new Promise(executor);
    }

    
    linkTable(relatedTable) {
        let domains = [
            relatedTable,
            this.domainObject.constructor.name
        ];

        return domains.sort().join('s_').toLowerCase();
    }

}

module.exports = Relationships;