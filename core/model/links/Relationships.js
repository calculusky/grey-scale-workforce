const MapperFactory = require('../../../modules/MapperFactory');
const DomainFactory = require('../../../modules/DomainFactory');

const KNEX = require('knex')({
    client: "mysql2", connection: {
        host: '127.0.0.1',
        user: 'root',
        password: 'Nigeriasns$1',
        database: 'travels'
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
            .innerJoin(tableName, function(){
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
            }).catch(err=>{
                return reject(err);
            });
        };
        return new Promise(executor);
    }

    hasOne(domainMapperName, foreignKey = "id", localKey = "id") {

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