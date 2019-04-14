const DomainFactory = require('../../../DomainFactory');
const ApiService = require('../../../ApiService');
const Error = require('../../../../core/Utility/ErrorUtils')();
let MapperFactory = null;
const Utils = require('../../../../core/Utility/Utils');

/**
 * Created by paulex on 8/30/18.
 * @name BaseRecordService
 */
class BaseRecordService extends ApiService {

    constructor(context) {
        super(context);
        MapperFactory = this.context.modelMappers;
    }

    /**
     * Creates fault pending reasons
     *
     * @param body {Object}
     * @param who {Session}
     * @returns {Promise<*>}
     */
    async createPendingReason(body = {}, who) {
        const PendingReasonMapper = MapperFactory.build(MapperFactory.PENDING_REASON);
        const PendingReason = DomainFactory.build(DomainFactory.PENDING_REASON);
        const reason = new PendingReason(body);

        if (!reason.validate()) return Promise.reject(Error.ValidationFailure(reason.getErrors().all()));

        ApiService.insertPermissionRights(reason, who);

        return PendingReasonMapper.createDomainRecord(reason).then(reason => {
            return Utils.buildResponse({data: reason});
        });
    }

    /**
     * Updates a pending reason value
     *
     * @param by {String}
     * @param value {String|Number}
     * @param body {Object}
     * @param who {Session}
     * @param API {API}
     * @returns {Promise<*|Promise|PromiseLike<{data?: *, code?: *}>|Promise<{data?: *, code?: *}>>}
     */
    async updatePendingReason(by, value, body = {}, who, API) {
        const PendingReasonMapper = MapperFactory.build(MapperFactory.PENDING_REASON);
        const PendingReason = DomainFactory.build(DomainFactory.PENDING_REASON);
        const reason = new PendingReason(body);

        return PendingReasonMapper.updateDomainRecord({by, value, domain: reason}, who).then(result => {
            return Utils.buildResponse({data: result.shift()});
        });
    }

    /**
     * Creates a fault category
     *
     * @param body
     * @param who
     * @returns {Promise<*>}
     */
    async createFaultCategory(body = {}, who = {}) {
        const FaultCategoryMapper = MapperFactory.build(MapperFactory.FAULT_CATEGORY);
        const FaultCategory = DomainFactory.build(DomainFactory.FAULT_CATEGORY);
        const category = new FaultCategory(body);

        if (!category.validate()) return Promise.reject(Error.ValidationFailure(category.getErrors().all()));

        ApiService.insertPermissionRights(category, who);

        return FaultCategoryMapper.createDomainRecord(category).then(category => {
            if (body.parent_id) this.createFaultSubCategories(body.parent_id, category.id);
            return Utils.buildResponse({data: category});
        });
    }

    /**
     * Create a fault sub categories
     *
     * Note: The database enforces that a category can only have one parent
     *
     * @todo update the parent of a child category
     * @param parentId {Number}
     * @param childId {Number}
     */
    createFaultSubCategories(parentId, childId) {
        const subCategories = {
            parent_category_id: parentId,
            child_category_id: childId,
            created_at: Utils.date.dateToMysql(),
            updated_at: Utils.date.dateToMysql()
        };
        return this.context.db().table("fault_categories").insert(subCategories).then(() => {
            return true;
        }).catch(() => {
            return false;
        });
    }

    /**
     * Updates a fault category
     *
     * @param by {String}
     * @param value {String|Number}
     * @param body {Object}
     * @param who {Session}
     * @param API {API}
     * @returns {Promise<*|Promise|PromiseLike<{data?: *, code?: *}>|Promise<{data?: *, code?: *}>>}
     */
    async updateFaultCategory(by, value, body = {}, who, API) {
        const FaultCategoryMapper = MapperFactory.build(MapperFactory.FAULT_CATEGORY);
        const FaultCategory = DomainFactory.build(DomainFactory.FAULT_CATEGORY);
        const category = new FaultCategory(body);

        return FaultCategoryMapper.updateDomainRecord({by, value, domain: category}, who).then(result => {
            if (body.parent && category.id) {
                this.context.db().table("fault_categories_subs")
                    .update({parent_category_id: body.parent_id})
                    .where('child_category_id', category.id)
                    .then()
            }
            return Utils.buildResponse({data: result.shift()});
        });
    }

    /**
     * Gets fault categories
     *
     * @param query {Object}
     * @param who {Session}
     * @returns {Promise<{data?: *, code?: *}>}
     */
    async getFaultCategories(query = {}, who) {
        const offset = (query.offset) ? parseInt(query.offset) : undefined,
            limit = (query.limit) ? parseInt(query.limit) : undefined,
            type = query['type'],
            weight = query['weight'];

        const faultCategories = await this.context.getKey("fault:categories", true);

        let items = [];
        Object.entries(faultCategories).forEach(([key, value]) => {
            if (value.hasOwnProperty("children")) delete value['children'];
            if (type && !type.split(",").map(i => i.toLowerCase()).includes(`${value['type']}`.toLowerCase())) return;
            if (weight && value['weight'] !== weight) return;
            items.push(value);
        });

        if (offset && limit) items = items.slice(offset, offset + limit);

        return Utils.buildResponse({data: {items}});
    }

    /**
     * Creates status
     *
     * @param body {Object}
     * @param who {Session}
     * @returns {Promise<*>}
     */
    async createStatus(body = {}, who) {
        const StatusMapper = MapperFactory.build(MapperFactory.STATUS);
        const Status = DomainFactory.build(DomainFactory.STATUS);
        const status = new Status(body);

        if (!status.validate()) return Promise.reject(Error.ValidationFailure(status.getErrors().all()));

        ApiService.insertPermissionRights(status, who);

        return StatusMapper.createDomainRecord(status).then(reason => {
            return Utils.buildResponse({data: reason});
        });
    }

    /**
     * Get status
     *
     * @param query {Object}
     * @param who {Session}
     * @returns {Promise<{data?: *, code?: *}>}
     */
    async getStatuses(query = {}, who) {
        const type = query['type'];
        const statuses = await this.context.getKey("statuses", true);

        let items = {};
        Object.entries(statuses).forEach(([key, value]) => {
            if (type && !type.split(",").map(i => i.toLowerCase()).includes(`${key}`.toLowerCase())) return;
            Reflect.set(items, key, value);
        });

        return Utils.buildResponse({data: items});
    }


    async getMobileFilterConfigs(who) {
        const configJson = require('../domain-objects/filter_config');
        const configKeys = Reflect.ownKeys(configJson);
        const {data: {data: statuses}} = await this.getStatuses({type: configKeys.join(",")}, who);

        configKeys.forEach(key => {
            configJson[key].forEach(filterItem => {
                switch (filterItem.keyName.toLowerCase()) {
                    case "status": {
                        filterItem.values = statuses[key].map(({id: key, name: value}) => ({key, value}));
                        break;
                    }
                    //TODO get the priority from a single accessible function
                    case "priority": {
                        filterItem.values = [
                            {"key": "0", "value": "Low"},
                            {"key": "1", "value": "Medium"},
                            {"key": "2", "value": "High"},
                            {"key": "3", "value": "Urgent"}
                            ];
                        break;
                    }
                }
            })
        });

        return Utils.buildResponse({data: configJson});
    }

}

module.exports = BaseRecordService;