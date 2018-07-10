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
                //Disable child being parent to themselves thus: if(group.parent[parentKey] !== gp[parentKey])
                return (gp[parentKey] && group.parent[parentKey] !== gp[parentKey])
                    ? findParents(_groups, group.parent, parentKey)
                    : _groups;
            }
        };
        //First lets load all groups and sub groups
        const iCols = ['id', 'name', 'type', 'short_name', 'parent_group_id'],
            tCols = ['group_subs.parent_group_id as parent', db.raw('GROUP_CONCAT(child_group_id) AS children')],
            gLeftJoin = ['group_subs', 'groups.id', 'group_subs.child_group_id'],
            gInnerJoin = ['group_subs', 'groups.id', 'group_subs.parent_group_id'],
            fCols1 = ['id', 'name', 'type', 'weight', 'parent_category_id'],
            fCols = ['fault_categories_subs.parent_category_id as parent', db.raw('GROUP_CONCAT(child_category_id) AS children')],
            fLeftJoin = ['fault_categories_subs', 'fault_categories.id', 'fault_categories_subs.child_category_id'],
            fInnerJoin = ['fault_categories_subs', 'fault_categories.id', 'fault_categories_subs.parent_category_id'];

        const [dbGroups, groupChildren, woTypes, aTypes, dbFCategories, fCatChildren] = await Promise.all([
            db.select(iCols).from("groups").leftJoin(...gLeftJoin).where('deleted_at', null),
            db.select(tCols).from('groups').innerJoin(...gInnerJoin).where('deleted_at', null).groupBy('parent_group_id'),
            db.select(['id', 'name']).from("work_order_types"),
            db.select(['id', 'name']).from("asset_types"),
            db.select(fCols1).from("fault_categories").leftJoin(...fLeftJoin).where("fault_categories.deleted_at", null),
            db.select(fCols).from("fault_categories").innerJoin(...fInnerJoin).where("fault_categories.deleted_at", null).groupBy('parent_category_id')
        ]);

        const groups = {}, groupParentChild = {}, workTypes = {}, assetTypes = {},
            faultCategories = {}, fCatParentChild = {};

        groupChildren.forEach(item => groupParentChild[item.parent] = item['children'].split(',').reverse());
        fCatChildren.forEach(item => fCatParentChild[item.parent] = item['children'].split(',').reverse());

        woTypes.forEach(workType => workTypes[workType.id] = workType);
        aTypes.forEach(assetType => assetTypes[assetType.id] = assetType);

        const mergeParent = (dataList, parentKey, store) => {
            for (let data of dataList) {
                const parentId = data[parentKey];
                if (parentId && parentId !== data.id) findParents(dataList, data, parentKey);
                delete data[parentKey] && (Object.assign(store[data.id] = {}, data));
            }
        };

        const mergeChildren = (dataList, parentOffspring, store)=>{
            dataList.forEach(data => {
                const children = parentOffspring[data.id];
                console.log(children);
                if (!children) return;
                store[data.id]['children'] = children.map(id => {
                    const {parent, ...t} = store[id] || {};
                    return (parent) ? t : null;
                }).filter(i => i);
            });
        };

        mergeParent(dbGroups, 'parent_group_id', groups);
        mergeParent(dbFCategories, 'parent_category_id', faultCategories);

        mergeChildren(dbGroups, groupParentChild, groups);
        mergeChildren(dbFCategories, fCatParentChild, faultCategories);

        this.persistence.set("groups", JSON.stringify(groups));
        this.persistence.set("work:types", JSON.stringify(workTypes));
        this.persistence.set("asset:types", JSON.stringify(assetTypes));
        this.persistence.set("fault:categories", JSON.stringify(faultCategories));
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