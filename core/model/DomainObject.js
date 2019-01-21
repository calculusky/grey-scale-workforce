//noinspection JSUnresolvedFunction
const RelationShips = require('./links/Relationships');
const validator = require('validatorjs');
const privateStore = new WeakMap();
const Utils = require('../Utility/Utils');

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
            mapKeys.forEach(key => {
                if (data[key] !== null
                    && data[key] !== undefined && data[key] !== '') this[key] = data[key];
            });
        }
        this._(this).relations = new RelationShips(this);

        this._(this).validate = () => {
            const valid = new validator(this, this.rules(), this.customErrorMessages());
            if (valid.passes(null)) return true;
            this._errors = valid.errors;
            return false;
        };

        //DomainObject Internal Configurations
        let validateErrors = [];
        Object.defineProperty(this, '_validate', {get: this._(this).validate, enumerable: false, configurable: false});
        Object.defineProperty(this, '_errors', {
            set: (v) => validateErrors = v,
            get: () => validateErrors,
            enumerable: false,
            configurable: false
        });
    }

    /**
     * Validates this model data with validation rules specified
     */
    validate(){
        return this._validate;
    }

    /**
     * returns the validation errors of this domain object
     */
    getErrors(){
        return this._errors;
    }

    isAuditAble(){
        return true;
    }

    toAuditAbleFormat(){
        return this;
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
            clKeys.forEach(key => {
                if (data[key])
                    newData[map[key]] = data[key];
            });
        } else {
            clKeys.forEach(key => {
                const dbKey = map[key];
                if (data.hasOwnProperty(dbKey)) {
                    newData[key] = data[dbKey];
                    this[key] = data[dbKey];
                }
            });
            // console.log(newData);
            this._(this).data = newData;
        }
        return newData;
    }

    /**
     * Assigned to values are received in array form e.g
     * "[1,2]", this function formats it for storage purpose
     *
     * @returns {*}
     */
    serializeAssignedTo() {
        if (this.assigned_to) Utils.serializeAssignedTo(this.assigned_to);
        return this;
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
        return [false, "deleted_at"];
    }

    /**
     * Should be overridden by sub-classes
     * @returns {{}}
     */
    rules() {
        return {};
    }

    customErrorMessages() {
        return {
            required: 'The :attribute is required.'
        };
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