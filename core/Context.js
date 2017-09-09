/**
 * Created by paulex on 7/5/17.
 */
const KNEX = require('knex');

//Private Fields
let _privateStore = new WeakMap();
/**
 * @name Context
 */
class Context {

    constructor(config) {
        this.config = config;
        this.database = KNEX({
            client: "mysql2",
            connection: config.database
        });
        this._(this).incoming_store = {};
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