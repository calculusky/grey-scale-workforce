const DomainFactory = require('../../../DomainFactory');
const ApiService = require('../../../ApiService');
let MapperFactory = null;
const Utils = require('../../../../core/Utility/Utils');
const validate = require('validatorjs');

/**
 * @name BaseRecordService
 * Created by paulex on 8/30/18.
 */
class BaseRecordService extends ApiService{

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
}

module.exports = BaseRecordService;