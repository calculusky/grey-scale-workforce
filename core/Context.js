/**
 * Created by paulex on 7/5/17.
 */
const KNEX = require('knex');
const storage = require('node-persist');

//Private Fields
let _privateStore = new WeakMap();
/**
 * @name Context
 */
class Context {

    constructor(config) {
        this.config = config;
        this.persistence = storage;
        this.database = KNEX({
            client: "mysql2",
            connection: config.database
        });
        this.persistence.init({dir: this.config.storage.persistence.path}).then(i=>this.loadStaticData(i));
        this._(this).incoming_store = {};
    }

    //we are going load certain static data into memory
    loadStaticData() {
        let findParents = (_groups, group, parentKey)=> {
            _groups.forEach(gp=> {
                if (gp.id == group[parentKey]) {
                    group.parent = gp;
                    if (gp[parentKey]) findParents(_groups, group.parent, parentKey);
                }
            });
        };
        //First lets load all groups and sub groups
        let groupSubs = this.database.select(['id', 'name', 'parent_group_id'])
            .from("groups")
            .leftJoin('group_subs', 'groups.id', 'group_subs.child_group_id');

        const groups = {};
        groupSubs.then(results=> {
            results.forEach(group=> {
                if (group['parent_group_id']) {
                    findParents(results, group, 'parent_group_id');
                }
                delete group['parent_group_id'];
                groups[group.id] = group;
            });
            this.persistence.setItem("groups", groups);
        });

        //Now lets get work order types
        let wResultSets = this.database.select(['id', 'name']).from("work_order_types");
        const workTypes = {};
        wResultSets.then(results=> {
            results.forEach(type=> {
                workTypes[type.id] = type;
            });
            this.persistence.setItem("work_types", workTypes);
        });

        //Lets load all assets types
        let aResultSets = this.database.select(['id', 'name']).from("asset_types");
        const assetTypes = {};
        aResultSets.then(results=> {
            results.forEach(type=> {
                assetTypes[type.id] = type;
            });
            this.persistence.setItem("asset_types", assetTypes);
        });
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