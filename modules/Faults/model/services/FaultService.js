const ApiService = require('../../../ApiService');
const DomainFactory = require('../../../DomainFactory');
const Utils = require('../../../../core/Utility/Utils');
const Error = require('../../../../core/Utility/ErrorUtils')();
const validate = require('validatorjs');
let MapperFactory = null;

/**
 * @author Paul Okeke
 * @name FaultService
 * Created by paulex on 7/4/17.
 */
class FaultService extends ApiService {
    /**
     *
     * @param context
     */
    constructor(context) {
        super(context);
        MapperFactory = this.context.modelMappers;
    }


    /**
     *
     * @param value
     * @param by
     * @param who
     * @param offset
     * @param limit
     * @returns {Promise}
     */
    getFaults(value, by = "id", who = {api: -1}, offset = 0, limit = 10) {

        const FaultMapper = MapperFactory.build(MapperFactory.FAULT);
        const executor = (resolve, reject) => {

        };
        return new Promise(executor)
    }

    /**
     *
     * @param body {Object}
     * @param who
     * @param files
     * @param API {API}
     */
    async createFault(body = {}, who = {}, files = [], API) {
        const Fault = DomainFactory.build(DomainFactory.FAULT);
        const redis = this.context.persistence;
        const fault = new Fault(body);

        ApiService.insertPermissionRights(fault, who);

        if (!fault.issue_date) fault.issue_date = Utils.date.dateToMysql();

        const validator = new validate(fault, fault.rules(), fault.customErrorMessages());

        if (validator.fails()) return Promise.reject(Error.ValidationFailure(validator.errors.all()));

        //Get Mapper
        const groups = await Utils.redisGet(redis, "groups").catch(_ => (Promise.reject(Error.InternalServerError)));

        const group = groups[fault.group_id];

        if (!group) return Promise.reject(Error.GroupNotFound);

        const bUnit = Utils.getGroupParent(group, 'business_unit') || group;

        fault.fault_no = ``;//TODO generate fault no

        const FaultMapper = MapperFactory.build(MapperFactory.FAULT);

        const record = await FaultMapper.createDomainRecord(fault).catch(err => (Promise.reject(err)));

        if (files.length) {
            API.attachments().createAttachment({module: "faults", relation_id: record.id}, who, files, API).then();
        }
        return Utils.buildResponse({data: record});
    }

    /**
     *
     * @param by
     * @param value
     * @returns {*}
     */
    deleteFault(by = "id", value) {
        const FaultMapper = MapperFactory.build(MapperFactory.FAULT);
        return FaultMapper.deleteDomainRecord({by, value}).then(count => {
            if (!count) {
                return Utils.buildResponse({status: "fail", data: {message: "The specified record doesn't exist"}});
            }
            return Utils.buildResponse({data: {by, message: "Fault deleted"}});
        });
    }
}

module.exports = FaultService;