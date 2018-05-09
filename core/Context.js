/**
 * @author Paul Okeke
 * Created by paulex on 7/5/17.
 */
const KNEX = require('knex');
const MapperFactory = require('./factory/MapperFactory');
const redis = require("redis"), client = redis.createClient({
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379
});
let globalContext = null;

//Private Fields
let _privateStore = new WeakMap();

/**
 * @name Context
 */
class Context {

    constructor(config) {
        this.config = config;
        this.persistence = client;
        this.database = KNEX({
            client: "mysql2",
            connection: {
                "host": process.env.DB_HOST,
                "user": process.env.DB_USER,
                "password": process.env.DB_PASS,
                "database": process.env.DB_DATABASE
            }
        });

        this.persistence.on('ready', () => this.loadStaticData());
        // this.persistence.init({dir: this.config.storage.persistence.path}).then(i=>this.loadStaticData(i));
        this._(this).incoming_store = {};

        //load the modelMappers here into memory
        this._(this).buildModelMappers = () => {
            let mappers = this.config['mappers'];
            if (mappers) {
                mappers.forEach(mapper => {
                    let mapperName = mapper.substring(0, mapper.indexOf(":"));
                    let mapperPath = mapper.substring(mapper.indexOf(":") + 1, mapper.length);
                    MapperFactory.build(mapperName, mapperPath, this);
                });
            }
        };
        this._(this).buildModelMappers();
        this.modelMappers = MapperFactory;

        Context.globalContext = this;
    }

    //we are going load certain static data into memory
    async loadStaticData() {
        const db = this.database;
        let findParents = (_groups, group, parentKey) => {
            for (let gp of _groups) {
                if (gp.id !== group[parentKey]) continue;
                group.parent = gp;
                return (gp[parentKey]) ? findParents(_groups, group.parent, parentKey) : _groups;
            }
        };
        //First lets load all groups and sub groups
        const iCols = ['id', 'name', 'type', 'short_name', 'parent_group_id'],
            tCols = ['group_subs.parent_group_id as parent', db.raw('GROUP_CONCAT(child_group_id) AS children')],
            leftJoin = ['group_subs', 'groups.id', 'group_subs.child_group_id'],
            innerJoin = ['group_subs', 'groups.id', 'group_subs.parent_group_id'];

        const [dbGroups, groupChildren, woTypes, aTypes] = await Promise.all([
            db.select(iCols).from("groups").leftJoin(...leftJoin).where('deleted_at', null),
            db.select(tCols).from('groups').innerJoin(...innerJoin).where('deleted_at', null).groupBy('parent_group_id'),
            db.select(['id', 'name']).from("work_order_types"),
            db.select(['id', 'name']).from("asset_types"),
        ]);

        const groups = {}, workTypes = {}, assetTypes = {}, parentChild = {};

        groupChildren.forEach(item => parentChild[item.parent] = item['children'].split(',').reverse());

        woTypes.forEach(workType => workTypes[workType.id] = workType);
        aTypes.forEach(assetType => assetTypes[assetType.id] = assetType);

        for (let group of dbGroups) {
            //if parent_group_id and the parent_group_id isn't equals to the group_child_id
            const parentId = group['parent_group_id'];
            if (parentId && parentId !== group.id) findParents(dbGroups, group, 'parent_group_id');
            delete group['parent_group_id'] && (Object.assign(groups[group.id] = {}, group));
        }

        dbGroups.forEach(group => {
            const children = parentChild[group.id];
            if (!children) return;
            groups[group.id]['children'] = children.map(id => {
                const {parent, ...t} = groups[id] || {};
                return (parent) ? t : null;
            }).filter(i => i);
        });
        this.persistence.set("groups", JSON.stringify(groups));
        this.persistence.set("work:types", JSON.stringify(workTypes));
        this.persistence.set("asset:types", JSON.stringify(assetTypes));
        return true;
    }

    setIncoming(requestId, relationId) {
        this._(this).incoming_store[requestId] = relationId;
    }

    getIncoming(requestId) {
        return this._(this).incoming_store[requestId];
    }

    deleteIncoming(requestId) {
        if (this._(this).incoming_store[requestId]) {
            delete this._(this).incoming_store[requestId];
            return true;
        }
        return false;
    }


    _(instance) {
        if (!instance instanceof Context) throw ReferenceError("You are trying to access my internal part");
        let api = _privateStore.get(instance);
        if (!api) {
            api = {};
            _privateStore.set(instance, api);
        }
        return api;
    }
}

if (!String.prototype.padStart) {
    String.prototype.padStart = function padStart(targetLength, padString) {
        targetLength = targetLength >> 0; //floor if number or convert non-number to 0;
        padString = String(padString || ' ');
        if (this.length > targetLength) {
            return String(this);
        }
        else {
            targetLength = targetLength - this.length;
            if (targetLength > padString.length) {
                //append to original to ensure we are longer than needed
                padString += padString.repeat(targetLength / padString.length);
            }
            return padString.slice(0, targetLength) + String(this);
        }
    };
}

module.exports = Context;