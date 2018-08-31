const DomainFactory = require('../../../DomainFactory');
const ApiService = require('../../../ApiService');
let MapperFactory = null;
const Utils = require('../../../../core/Utility/Utils');
const validate = require('validatorjs');

/**
 * @name BaseRecordService
 * Created by paulex on 8/30/18.
 */
class BaseRecordService extends ApiService {

    constructor(context) {
        super(context);
        MapperFactory = this.context.modelMappers;
    }

    /**
     * Creates fault pending reasons
     *
     * @param body
     * @param who
     * @returns {Promise<*>}
     */
    async createPendingReason(body = {}, who = {}) {
        const PendingReason = DomainFactory.build(DomainFactory.PENDING_REASON);
        const reason = new PendingReason(body);

        ApiService.insertPermissionRights(reason, who);

        let validator = new validate(reason, reason.rules(), reason.customErrorMessages());

        if (validator.fails()) {
            return Promise.reject(Utils.buildResponse({status: "fail", data: validator.errors.all()}, 400));
        }
        const PendingReasonMapper = MapperFactory.build(MapperFactory.PENDING_REASON);

        return PendingReasonMapper.createDomainRecord(reason).then(reason => {
            return Utils.buildResponse({data: reason});
        });
    }

    /**
     * Updates a pending reason value
     *
     * @param by
     * @param value
     * @param body
     * @param who
     * @returns {Promise<*|Promise|PromiseLike<{data?: *, code?: *}>|Promise<{data?: *, code?: *}>>}
     */
    async updatePendingReason(by, value, body = {}, who) {
        const PendingReason = DomainFactory.build(DomainFactory.PENDING_REASON);
        const reason = new PendingReason(body);

        const PendingReasonMapper = MapperFactory.build(MapperFactory.PENDING_REASON);

        return PendingReasonMapper.updateDomainRecord({by, value, domain: reason}).then(result => {
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
        const FaultCategory = DomainFactory.build(DomainFactory.FAULT_CATEGORY);
        const category = new FaultCategory(body);

        ApiService.insertPermissionRights(category, who);

        let validator = new validate(category, category.rules(), category.customErrorMessages());

        if (validator.fails()) {
            return Promise.reject(Utils.buildResponse({status: "fail", data: validator.errors.all()}, 400));
        }
        const FaultCategoryMapper = MapperFactory.build(MapperFactory.FAULT_CATEGORY);

        return FaultCategoryMapper.createDomainRecord(category).then(category => {
            if (body.parent_id) {
                // The database should enforce that a category can only have one parent
                this.context.database.table("fault_categories").insert({
                    parent_category_id: body.parent_id,
                    child_category_id: category.id,
                    created_at: category.created_at,
                    updated_at: category.updated_at
                }).then();
            }
            return Utils.buildResponse({data: category});
        });
    }


    /**
     * Updates a fault category
     *
     * @param by
     * @param value
     * @param body
     * @param who
     * @returns {Promise<*|Promise|PromiseLike<{data?: *, code?: *}>|Promise<{data?: *, code?: *}>>}
     */
    async updateFaultCategory(by, value, body = {}, who) {
        const FaultCategory = DomainFactory.build(DomainFactory.FAULT_CATEGORY);
        const category = new FaultCategory(body);

        const FaultCategoryMapper = MapperFactory.build(MapperFactory.FAULT_CATEGORY);

        return FaultCategoryMapper.updateDomainRecord({by, value, domain: category}).then(result => {
            if (body.parent && category.id) {
                this.context.database.table("fault_categories_subs")
                    .update({parent_category_id: body.parent_id})
                    .where('child_category_id', category.id)
                    .then()
            }
            return Utils.buildResponse({data: result.shift()});
        });
    }

}

module.exports = BaseRecordService;