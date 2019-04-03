const ApiService = require('../../../ApiService');
const DomainFactory = require('../../../DomainFactory');
const Utils = require('../../../../core/Utility/Utils');
const Error = require('../../../../core/Utility/ErrorUtils')();
const Events = require('../../../../events/events');
const FaultDataTable = require('../commons/FaultDataTable');
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
     * Retrieves Faults
     *
     * @param query {Object}
     * @param who {Session}
     * @returns {Promise}
     */
    async getFaults(query = {}, who) {
        const Fault = DomainFactory.build(DomainFactory.FAULT);
        const db = this.context.db();

        const [groups, categories] = await Promise.all([
            this.context.getKey("groups", true),
            this.context.getKey("fault:categories", true)
        ]);

        const faults = [], results = await this.buildQuery(query);

        for (const item of results) {
            //@temporary fix
            item['category_id'] = item['fault_category_id'];
            const fault = new Fault(item);
            await renderFaultDetails(fault, db, groups, categories);
            faults.push(fault);
        }

        return Utils.buildResponse({data: {items: faults}});
    }

    /**
     * Creates a new fault
     *
     * @param body {Object}
     * @param who {Session}
     * @param files {Array}
     * @param API {API}
     */
    async createFault(body = {}, who, API, files = []) {
        const Fault = DomainFactory.build(DomainFactory.FAULT);
        const fault = new Fault(body);

        if (!(await fault.validateSource(this.context.db())))
            return Promise.reject(Error.ValidationFailure({relation_id: ["The related record doesn't exist."]}));

        fault.serializeAssignedTo().setIssueDateIfNull(Utils.date.dateToMysql());

        ApiService.insertPermissionRights(fault, who);

        if (!fault.validate()) return Promise.reject(Error.ValidationFailure(fault.getErrors().all()));

        if (!(await API.groups().isGroupIdValid(fault.group_id))) return Promise.reject(Error.GroupNotFound);

        const FaultMapper = MapperFactory.build(MapperFactory.FAULT);

        const record = await FaultMapper.createDomainRecord(fault, who).catch(err => (Promise.reject(err)));

        onFaultCreated(record, fault, who, files, API);

        return Utils.buildResponse({data: record});
    }

    /**
     * Updates an existing fault
     *
     * @param by {String}
     * @param value {String|Number}
     * @param body {Object}
     * @param who {Session}
     * @param files {Array}
     * @param API {API}
     * @returns {Promise<void>|*}
     */
    async updateFault(by, value, body = {}, who, files = [], API) {
        const Fault = DomainFactory.build(DomainFactory.FAULT);
        const FaultMapper = MapperFactory.build(MapperFactory.FAULT);
        const model = (await this.context.db()("faults").where(by, value).select(['*'])).shift();
        const fault = new Fault(body);

        if (!model) return Promise.reject(Error.RecordNotFound());

        fault.updateAssignedTo(model.assigned_to);

        if (files.length) {
            API.attachments().createAttachment({module: "faults", relation_id: fault.id}, who, files, API).then();
        }

        return FaultMapper.updateDomainRecord({value, domain: fault}, who).then(result => {
            Events.emit("fault_updated", fault, who, model);
            return Utils.buildResponse({data: Utils.convertDataKeyToJson(result.shift(), "labels", "assigned_to")});
        });
    }

    /**
     * For getting dataTable records
     *
     * @param body {Object}
     * @param who {Session}
     * @returns {Promise<IDtResponse>}
     */
    async getFaultTableRecords(body, who) {
        const faultDataTable = new FaultDataTable(this.context.database, MapperFactory.build(MapperFactory.FAULT), who);
        const editor = await faultDataTable.addBody(body).make();
        return editor.data();
    }

    /**
     * Deletes a fault
     *
     * @param by {String}
     * @param value {String|Number}
     * @param who {Session}
     * @param API {API}
     * @returns {*}
     */
    deleteFault(by = "id", value, who, API) {
        const FaultMapper = MapperFactory.build(MapperFactory.FAULT);
        return FaultMapper.deleteDomainRecord({by, value}, true, who).then(count => {
            if (!count) return Promise.reject(Error.RecordNotFound());
            return Utils.buildResponse({data: {message: "Fault successfully deleted."}});
        });
    }

    /**
     *
     * @param query
     * @returns {*}
     * @private
     */
    buildQuery(query) {
        const {
            id,
            status,
            priority,
            category_id,
            offset = 0,
            limit = 10,
            assigned_to,
            created_by,
            from_date,
            to_date
        } = query;

        const resultSet = this.context.db()("faults").select(["*"]);

        if (id) resultSet.where('id', id);
        if (status) resultSet.whereIn('status', status.split(","));
        if (category_id) resultSet.whereIn("fault_category_id", category_id.split(","));
        if (priority) resultSet.whereIn("priority", priority.split(","));
        if (assigned_to) resultSet.whereRaw(`JSON_CONTAINS(assigned_to, '{"id":${assigned_to}}')`);
        if (created_by) resultSet.where("created_by", created_by);
        if (from_date && to_date) resultSet.whereBetween('start_date', [from_date, to_date]);

        resultSet.where('deleted_at', null).limit(Number(limit)).offset(Number(offset)).orderBy("id", "desc");

        return resultSet;
    }
}

/**
 *
 * @param record
 * @param body
 * @param session {Session}
 * @param files {Array}
 * @param API {API}
 * @private
 */
function onFaultCreated(record, body, session, files, API) {
    Utils.convertDataKeyToJson(record, "labels", "assigned_to");

    record['created_by'] = {
        id: session.getAuthUser().getUserId(),
        username: session.getAuthUser().getUsername()
    };
    if (files.length) API.attachments().createAttachment({
        module: "faults",
        relation_id: record.id
    }, session, files, API).then();

    Events.emit("fault_added", record, session);
}

/**
 * For lack of a better function name, we have chosen to name this function
 * renderFaultDetails because it tends to fetch related fault details
 * and sets it on the fault object. However this method name is subject to change.
 *
 * TODO Refactor
 *
 * @param fault
 * @param db
 * @param groups
 * @param categories
 * @returns {Promise<*>}
 */
async function renderFaultDetails(fault, db, groups, categories) {

    const task = [
        fault.relatedTo(),
        fault.createdBy(),
        fault.getAssignedUsers(db),
        ...fault.getRelatedRecordCount(db)
    ];

    const [
        relatedTo,
        createdBy,
        assignedTo,
        notesCount,
        attachmentCount,
        wCount
    ] = await Promise.all(task);

    fault['category'] = categories[fault['category_id']];
    fault['created_by'] = createdBy.records.shift() || {};
    fault['group'] = groups[fault['group_id']];
    fault[fault.related_to.slice(0, -1)] = relatedTo.records.shift() || {};
    fault['assigned_to'] = assignedTo;

    if (notesCount && attachmentCount) {
        fault['notes_count'] = notesCount.shift()['notes_count'] || 0;
        fault['attachments_count'] = attachmentCount.shift()['attachments_count'] || 0;
    }
    fault['wo_count'] = wCount.shift()['works_count'];

    const faultGroup = fault['group'];
    if (faultGroup && faultGroup['children']) delete fault['group']['children'];
    if (faultGroup && faultGroup['parent']) delete fault['group']['parent'];

    return fault;
}

module.exports = FaultService;