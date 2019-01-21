/**
 * @author Paul Okeke
 * Created by paulex on 7/5/17.
 */
const KNEX = require('knex');
const MapperFactory = require('./factory/MapperFactory');
const knexConfig = require('../knexfile');
const Persistence = require('../core/persistence/Persistence');
const EventEmitter = require('events');
// let globalContext = null;

//Private Fields
let _privateStore = new WeakMap();

require('./extensions');

/**
 * @name Context
 */
class Context extends EventEmitter {

    constructor(config) {
        super();
        this.config = config;

        //TODO make database property private: to avoid external users overriding the value
        this.database = KNEX(knexConfig[process.env.NODE_ENV]);
        this._(this).persistence = new Persistence();
        this._(this).persistence.connect().getClient().on('ready', () => this.loadStaticData());

        this._(this).incoming_store = {};

        this.modelMappers = MapperFactory;
        Context.globalContext = this;
    }

    /**
     * Set keys with values
     *
     * @param keys
     */
    setKey(...keys) {
        this._(this).persistence.set(...keys);
    }

    /**
     * Get a value by the key
     *
     * @param key
     * @param toJson
     */
    async getKey(key, toJson = false) {
        return (toJson) ? JSON.parse((await this._(this).persistence.get(key))) : this._(this).persistence.get(key);
    }

    /**
     *
     * @param keys
     * @returns {boolean}
     */
    delKey(...keys) {
        return this._(this).persistence.delete(keys);
    }

    /**
     *
     * @returns {Persistence}
     */
    getPersistence() {
        return this._(this).persistence;
    }

    /**
     * Get the database for this app instance
     *
     * @returns {*}
     */
    db() {
        return this.database;
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

        const [dbGroups, groupChildren, woTypes, aTypes, dbFCategories, fCatChildren] = await
            Promise.all([
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

        const mergeChildren = (dataList, parentOffspring, store) => {
            dataList.forEach(data => {
                const children = parentOffspring[data.id];
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

        this.setKey("groups", JSON.stringify(groups));
        this.setKey("work:types", JSON.stringify(workTypes));
        this.setKey("asset:types", JSON.stringify(assetTypes));
        this.setKey("fault:categories", JSON.stringify(faultCategories));

        this.emit('loaded_static', true);
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

module.exports = Context;