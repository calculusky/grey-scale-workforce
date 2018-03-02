//noinspection JSUnresolvedFunction
const RelationShips = require('./links/Relationships');

const privateStore = new WeakMap();

/**
 * @author Paul Okeke
 * @Date 7/8/17
 * @name DomainObject
 */
class DomainObject {

    /**
     *
     * @param {DomainObject} data
     * @param {Object} map
     */
    constructor(data, map = {}) {
        this._(this).data = data;
        this._(this).map = map;

       
        //------Map data to Domain instances------//
        let hasData = (data && (Object.keys(data).length > 0));
        if (hasData) {
            let mapKeys = Object.keys(map);
            mapKeys.forEach(key=> {
                if (data[key] !== null
                    && data[key] !== undefined && data[key]!=='') this[key] = data[key];
            });
        }
        this._(this).relations = new RelationShips(this);
    }

    /**
     * Reverts this data to its Database equivalent
     * @param data
     * @param to
     */
    serialize(data = this._(this).data, to = "db") {
        let newData = {};
        const map = this._(this).map;
        let hasData = (data && (Object.keys(data).length > 0));
        if (!hasData) return newData;
        let clKeys = Object.keys(map);
        if (to === 'db') {
            clKeys.forEach(key=> {
                if (data[key])
                    newData[map[key]] = data[key];
            });
        } else {
            clKeys.forEach(key=> {
                const dbKey = map[key];
                if (data.hasOwnProperty(dbKey)) {
                    newData[key] = data[dbKey];
                    this[key] = data[dbKey];
                }
            });
        }
        return newData;
    }

    getTableColumn(clientName) {
        //TODO if the clientName is already in its tableColumn format
        //return as it is
        return this._(this).map[clientName];
    }

    required() {
        return [];
    }

    guard() {
        return [];
    }

    softDeletes() {
        return {uses: false, columns: {status: 'deleted', date: "deleted_at"}};
    }

    /**
     * Should be overridden by sub-classes
     * @returns {{}}
     */
    rules() {
        return {};
    }

    relations() {
        return this._(this).relations;
    }

    _(instance) {
        let store = privateStore.get(instance);
        if (!store) {
            store = {};
            privateStore.set(instance, store);
        }
        return store;
    }
}

module.exports = DomainObject;