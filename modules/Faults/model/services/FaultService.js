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
        const {id, status, priority, category_id, offset = 0, limit = 10, assigned_to, created_by, from_date, to_date} = query;
        const task = [
            Utils.getFromPersistent(this.context, "groups", true),
            Utils.getFromPersistent(this.context, "fault:categories", true)
        ];

        if (id) task.push(FaultMapper.findDomainRecord({by: "id", value: id}, offset, limit));
        else {
            const resultSet = db.table("faults").select(["*"]);
            if (status) resultSet.whereIn('status', status.split(","));
            if (category_id) resultSet.whereIn("fault_category_id", category_id.split(","));
            if (priority) resultSet.whereIn("priority", priority.split(","));
            if (assigned_to) resultSet.whereRaw(`JSON_CONTAINS(assigned_to, '{"id":${assigned_to}}')`);
            if (created_by) resultSet.where("created_by", created_by);
            if (from_date && to_date) resultSet.whereBetween('start_date', [from_date, to_date]);
            resultSet.where('deleted_at', null).limit(Number(limit)).offset(Number(offset)).orderBy("id", "desc");
            task.push(resultSet);
        }

        let [groups, categories, faults] = await Promise.all(task);
        faults = (faults.records) ? faults.records : faults;
        const Fault = DomainFactory.build(DomainFactory.FAULT);
        let i = 0;

        for (let fault of faults) {
            if (!(fault instanceof Fault)) {
                let f = new Fault();
                f.serialize(fault, "client");
                fault = f;
            }
            const task = [fault.relatedTo(), fault.createdBy(), Utils.getAssignees(fault.assigned_to, db)];
            task.push(
                db.count('note as notes_count').from("notes").where("module", "faults").where("relation_id", fault.id),
                db.count('id as attachments_count').from("notes").where("module", "attachments").where("relation_id", fault.id),
                db.count('id as works_count').from("work_orders").where("related_to", "faults").where("relation_id", fault.id)
            );

            const [relatedTo, createdBy, assignedTo, notesCount, attachmentCount, wCount] = await Promise.all(task);
            fault['category'] = categories[fault['category_id']];
            fault.created_by = createdBy.records.shift() || {};
            fault['group'] = groups[fault['group_id']];
            fault[fault.related_to.slice(0, -1)] = relatedTo.records.shift() || {};
            fault['assigned_to'] = assignedTo;

            if (notesCount && attachmentCount) {
                fault['notes_count'] = notesCount.shift()['notes_count'];
                fault['attachments_count'] = attachmentCount.shift()['attachments_count'];
            }
            fault['wo_count'] = wCount.shift()['works_count'];

            if (fault['group']['children']) delete fault['group']['children'];
            if (fault['group']['parent']) delete fault['group']['parent'];

            faults[i] = fault;
            i++;
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
        const fault = new Fault(body);

        //If this fault is created from an external source then we should verify the relation_id
        const related = await Utils.verifyRelatedSource(this.context.database, fault).catch(console.error);
        if (!related) return Promise.reject(Error.ValidationFailure({relation_id: ["The related record doesn't exist."]}));

        fault.assigned_to = Utils.serializeAssignedTo(fault.assigned_to);

        ApiService.insertPermissionRights(fault, who);

        if (!fault.issue_date) fault.issue_date = Utils.date.dateToMysql();

        const validator = new validate(fault, fault.rules(), fault.customErrorMessages());

        if (validator.fails()) return Promise.reject(Error.ValidationFailure(validator.errors.all()));

        const groups = await Utils.getFromPersistent(this.context, "groups", true).catch(_ => (Promise.reject(Error.InternalServerError)));

        const group = groups[fault.group_id];

        if (!group) return Promise.reject(Error.GroupNotFound);

        fault.fault_no = ``;//TODO generate fault no

        const FaultMapper = MapperFactory.build(MapperFactory.FAULT);

        const record = await FaultMapper.createDomainRecord(fault).catch(err => (Promise.reject(err)));

        Utils.convertDataKeyToJson(record, "labels", "assigned_to");
        record['created_by'] = {id: who.sub, username: who.name};

        if (files.length) {
            API.attachments().createAttachment({module: "faults", relation_id: record.id}, who, files, API).then();
        }
        //If the fault is created internally via mr.working lets push the data to other service integrating to mrworking
        Events.emit("fault_added", record, who);

        return Utils.buildResponse({data: record});
    }

    /**
     *
     * @param by
     * @param value
     * @param body
     * @param who
     * @param files
     * @param API {API}
     * @returns {Promise<void>|*}
     */
    async updateFault(by, value, body = {}, who, files = [], API) {
        const Fault = DomainFactory.build(DomainFactory.FAULT);
        const FaultMapper = MapperFactory.build(MapperFactory.FAULT);

        let model = await this.context.database.table("faults").where(by, value).select(['*']);

        if (!model.length) return Utils.buildResponse({status: "fail", data: {message: "Fault doesn't exist"}}, 400);

        model = new Fault(model.shift());

        const fault = new Fault(body);

        if (fault.assigned_to)
            fault.assigned_to = Utils.updateAssigned(model.assigned_to, Utils.serializeAssignedTo(fault.assigned_to));

        if (files.length) {
            API.attachments().createAttachment({module: "faults", relation_id: fault.id}, who, files, API).then();
        }

        return FaultMapper.updateDomainRecord({value, domain: fault}).then(result => {
            Events.emit("fault_updated", fault, who, model);
            return Utils.buildResponse({data: Utils.convertDataKeyToJson(result.shift(), "labels", "assigned_to")});
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

    async attributesToValues(colName, values = [], ctx, modelType = null) {
        switch (colName) {
            case "priority":
                return values.map(i => Utils.getFaultPriority(i));
            case "status":
                return values.map(i => Utils.getFaultStatus(i));
            case "category_id" || "fault_category_id":
                const categories = await Utils.getFromPersistent(ctx, "fault:categories", true);
                return values.map(i => categories[i]);
            default:
                return values;
        }
    }
}

module.exports = FaultService;