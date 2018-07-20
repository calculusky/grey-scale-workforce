const ApiService = require('../../../ApiService');
const DomainFactory = require('../../../DomainFactory');
const Utils = require('../../../../core/Utility/Utils');
const Error = require('../../../../core/Utility/ErrorUtils')();
const validate = require('validatorjs');
const Events = require('../../../../events/events');
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
     * @param query
     * @param who
     * @returns {Promise}
     */
    async getFaults(query = {}, who = {}) {
        const db = this.context.database;
        const FaultMapper = MapperFactory.build(MapperFactory.FAULT);
        const {id, status, priority, category_id, offset, limit, assigned_to, created_by, from_date, to_date} = query;
        const task = [Utils.getFromPersistent(this.context, "groups", true)];
        if (id) task.push(FaultMapper.findDomainRecord({by: "id", value: id}, offset, limit));
        else {
            const resultSet = db.table("faults").select(["*"]).where("deleted_at", null);
            if (status) resultSet.whereIn('status', status.split(","));
            if (category_id) resultSet.whereIn("fault_category_id", category_id.split(","));
            if (priority) resultSet.whereIn("priority", priority.split(","));
            if (assigned_to) resultSet.whereRaw(`JSON_CONTAINS(assigned_to, '{"id":${assigned_to}}')`);
            if (created_by) resultSet.where("created_by", created_by);
            if (from_date && to_date) resultSet.whereBetween('start_date', [from_date, to_date]);
            task.push(resultSet);
        }

        let [groups, faults] = await Promise.all(task);
        faults = (faults.records) ? faults.records : faults;
        const Fault = DomainFactory.build(DomainFactory.FAULT);
        for (let fault of faults) {
            if (!(fault instanceof Fault)) fault = new Fault(fault);
            const [relatedTo, assignedTo] = await Promise.all([fault.relatedTo(), Utils.getAssignees(fault.assigned_to, db)]);
            console.log(assignedTo);
            fault['group'] = groups[fault['group_id']];
            fault[fault.related_to] = relatedTo.records.shift() || {};
            fault['assigned_to'] = assignedTo;
        }
        return Utils.buildResponse({data: {items: faults}});
    }

    /**
     *
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

        //If this fault is created from an external source then we should verify the relation_id
        const related = await Utils.verifyRelatedSource(this.context.database, fault).catch(console.error);
        if (!related) return Promise.reject(Error.ValidationFailure({relation_id: ["The related record doesn't exist."]}));

        fault.assigned_to = Utils.serializeAssignedTo(fault.assigned_to);

        ApiService.insertPermissionRights(fault, who);

        if (!fault.issue_date) fault.issue_date = Utils.date.dateToMysql();

        const validator = new validate(fault, fault.rules(), fault.customErrorMessages());

        if (validator.fails()) return Promise.reject(Error.ValidationFailure(validator.errors.all()));

        const groups = await Utils.redisGet(redis, "groups").catch(_ => (Promise.reject(Error.InternalServerError)));

        const group = groups[fault.group_id];

        if (!group) return Promise.reject(Error.GroupNotFound);

        // const bUnit = Utils.getGroupParent(group, 'business_unit') || group;

        fault.fault_no = ``;//TODO generate fault no

        const FaultMapper = MapperFactory.build(MapperFactory.FAULT);

        const record = await FaultMapper.createDomainRecord(fault).catch(err => (Promise.reject(err)));

        if (files.length) {
            API.attachments().createAttachment({module: "faults", relation_id: record.id}, who, files, API).then();
        }

        //If the fault is created internally via mr.working lets push the data to other service integrating to mrworking
        if (!record.source) Events.emit("fault_added", record, who);

        return Utils.buildResponse({data: record});
    }

    /**
     *
     * @param by
     * @param value
     * @param body
     * @param who
     * @param file
     * @param API {API}
     * @returns {Promise<void>|*}
     */
    async updateFault(by, value, body = {}, who, file = [], API) {
        const Fault = DomainFactory.build(DomainFactory.FAULT);
        const FaultMapper = MapperFactory.build(MapperFactory.FAULT);

        let model = await this.context.database.table("faults").where(by, value).select(['assigned_to','id']);


        if (!model.length) return Utils.buildResponse({status: "fail", data: {message: "Fault doesn't exist"}}, 400);

        model = new Fault(model.shift());

        const fault = new Fault(body);

        if (fault.assigned_to)
            fault.assigned_to = Utils.updateAssigned(model.assigned_to, Utils.serializeAssignedTo(fault.assigned_to));

        return FaultMapper.updateDomainRecord({value, domain: fault}).then(result => {
            //Send updated fault to other services.
            Events.emit("fault_updated", value, who);
            return Utils.buildResponse({data: result.shift()});
        });
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