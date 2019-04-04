/**
 * Created by paulex on 7/4/17.
 */
const ApiService = require('../../../ApiService');
const DomainFactory = require('../../../DomainFactory');
const Utils = require('../../../../core/Utility/Utils');
const validate = require('validatorjs');
const Error = require('../../../../core/Utility/ErrorUtils')();
const {differenceBy} = require("lodash");
const Events = require('../../../../events/events');
const ExportQuery = require('../WorkOrderExportQuery');
const WorkOrderDataTable = require('../commons/WorkOrderDataTable');
let MapperFactory = null;

/**
 * @name WorkOrderService
 */
class WorkOrderService extends ApiService {

    constructor(context) {
        super(context);
        MapperFactory = this.context.modelMappers;
        this.moduleName = "work_orders";
    }

    /**
     * Creates a new work order
     *
     * @param body {Object}
     * @param who {Session}
     * @param files {Array}
     * @param API {API}
     * @returns {Promise<*>}
     */
    async createWorkOrder(body = {}, who, API, files = []) {
        const WorkOrder = DomainFactory.build(DomainFactory.WORK_ORDER);
        const workOrder = new WorkOrder(body);

        workOrder.serializeAssignedTo().setIssueDate();

        if (!workOrder.validate()) return Promise.reject(Error.ValidationFailure(workOrder.getErrors().all()));

        ApiService.insertPermissionRights(workOrder, who);

        const group = await API.groups().isGroupIdValid(workOrder.group_id);

        if (!group) return Promise.reject(Error.GroupNotFound);

        await workOrder.generateWorkOrderNo(this.context, group).catch(() => (Promise.reject(Error.InternalServerError)));

        const WorkOrderMapper = MapperFactory.build(MapperFactory.WORK_ORDER);

        const record = await WorkOrderMapper.createDomainRecord(workOrder, who).catch(err => (Promise.reject(err)));

        onWorkOrderCreated(record, body, who, files, API);

        return Utils.buildResponse({data: record});
    }

    /**
     *
     * @param value {String|Number}
     * @param by
     * @param who {Session}
     * @param offset {Number}
     * @param limit {Number}
     * @returns {Promise}
     * @deprecated Since v2.0.0-alpha01
     * @see getWorkOrders
     */
    async getWorkOrder(value = '?', by = "id", who = {}, offset, limit) {
        console.warn("Calling a deprecated function!");
        const WorkOrderMapper = MapperFactory.build(MapperFactory.WORK_ORDER);
        if (typeof value === 'string' && Utils.isWorkOrderNo(value)) {
            by = "work_order_no";
            value = value.replace(/-/g, "");
        }

        const results = await WorkOrderMapper.findDomainRecord({by, value}, offset, limit, 'created_at', 'desc')
            .catch(err => {
                return Promise.reject(err)
            });

        const workOrders = results.records;

        if (!workOrders.length) return Utils.buildResponse({data: {items: results.records}});

        return onListWorkOrders(workOrders, this.context, this.moduleName, true);
    }

    /**
     * Updates a work order
     *
     * @param by {String}
     * @param value {String|Number}
     * @param body {Object}
     * @param who {Session}
     * @param files {Array}
     * @param API {API}
     * @returns {Promise<void>|*}
     */
    async updateWorkOrder(by, value, body = {}, who, files = [], API) {
        const WorkOrder = DomainFactory.build(DomainFactory.WORK_ORDER);
        const WorkOrderMapper = MapperFactory.build(MapperFactory.WORK_ORDER);
        const model = (await WorkOrderMapper.findDomainRecord({by, value})).records.shift();
        const workOrder = new WorkOrder(body);

        if (!model) return Promise.reject(Error.RecordNotFound());

        workOrder.updateAssignedTo(model.assigned_to);

        if (!workOrder.type_id) workOrder.setType(model.type_id);

        return WorkOrderMapper.updateDomainRecord({value, domain: workOrder}, who).then(result => {
            const [updateRecord] = result;
            onWorkOrderUpdated(updateRecord, model, who, files, API);
            return Utils.buildResponse({data: updateRecord});
        });
    }

    /**
     * Updates multiple work orders
     *
     * @param body {Object}
     * @param who {Session}
     * @param API {API}
     * @returns {Promise<{data?: *, code?: *}>}
     */
    async updateMultipleWorkOrders(body, who, API) {
        const ids = Object.keys(body), response = [];
        for (let id of ids) {
            const update = await this.updateWorkOrder('id', id, body[id], who, [], API).catch(e => !response.push(e.code));
            if (update) response.push(200);
        }
        return Utils.buildResponse({data: response});
    }


    /**
     * Queries and returns a list of work orders.
     *
     * @param query {Object}
     * @param who {Session}
     * @returns {Promise<*>}
     */
    async getWorkOrders(query, who) {
        const records = await this.buildQuery(query).catch(err => {
            return Promise.reject(Utils.buildResponse(Utils.getMysqlError(err), 400));
        });
        const WorkOrder = DomainFactory.build(DomainFactory.WORK_ORDER);
        const workOrders = records.map(record => new WorkOrder(record));

        if (!records.length) return Utils.buildResponse({data: {items: workOrders}});

        return onListWorkOrders(workOrders, this.context, this.moduleName, false).catch(console.error);
    }


    /**
     * Searches for work orders.
     *
     * @param keyword {String}
     * @param offset {Number}
     * @param limit {Number}
     * @returns {Promise.<*>}
     */
    async searchWorkOrders(keyword = "", offset = 0, limit = 10) {
        const WorkOrder = DomainFactory.build(DomainFactory.WORK_ORDER);
        let fields = [
            'id',
            'work_order_no',
            'related_to',
            'relation_id',
            'type_id',
            'labels',
            'status'
        ];
        keyword = keyword.replace(/g/, "");
        let resultSets = this.context.db().select(fields).from('work_orders')
            .where('work_order_no', 'like', `%${keyword}%`).where("deleted_at", null)
            .limit(parseInt(limit)).offset(parseInt(offset)).orderBy('work_order_no', 'asc');

        const results = await resultSets.catch(err => (Utils.buildResponse({status: "fail", data: err}, 500)));
        let workOrders = results.map(item => {
            return new WorkOrder(item);
        });
        return Utils.buildResponse({data: {items: workOrders}});
    }


    /**
     * Get material requisition belonging to a work order
     *
     * @param workOrderId {String}
     * @param query {Object}
     * @param who {Session}
     * @param API {API}
     * @returns {Promise<{data?: *, code?: *}>}
     */
    async getWorkOrderMaterialRequisitions(workOrderId, query = {}, who, API) {
        query.work_order_id = workOrderId;
        return API.materialRequisitions().getMaterialRequisitions(query, who).then((resp) => {
            resp.data.data.work_order_id = workOrderId;
            return resp;
        });
    }

    /**
     * Changes a work order status.
     * Note: This method can also be used to quickly add a note
     *
     * @param value {Number} The Work Order Id
     * @param status {Number}
     * @param note {Note|Object}
     * @param files {Array}
     * @param who {Session}
     * @param API {API}
     * @returns {Promise.<WorkOrder>|*}
     */
    async changeWorkOrderStatus(value/*WorkOrderId*/, status, who, note, files = [], API) {
        const updateObj = {
            status,
            status_comment: note['status_comment'],
            actual_start_date: note['actual_start_date']
        };
        const updated = await this.updateWorkOrder("id", value, updateObj, who, [], API);
        if (note && note.note) API.notes().createNote(note, who, API, files).catch(console.error);
        return updated;
    }

    /**
     * Exports work orders to excel
     *
     * @param query {Object}
     * @param who {Session}
     * @param API {API}
     * @returns {Promise<void>}
     */
    async exportWorkOrders(query, who, API) {
        const validator = new validate(query, {type_id: "required"});
        if (validator.fails(null)) return Promise.reject(Error.ValidationFailure(validator.errors.all()));
        const WorkOrderMapper = MapperFactory.build(MapperFactory.WORK_ORDER);
        const exportWorkOrderQuery = new ExportQuery(query, WorkOrderMapper, who, API);
        const groups = await this.context.getKey("groups", true);
        return exportWorkOrderQuery.setGroups(groups).export().catch(() => {
            return Utils.buildResponse({status: "fail", data: {message: "There was an error fetching the export"}});
        });
    }

    /**
     * For getting dataTable records
     *
     * @param body {Object}
     * @param who {Session}
     * @returns {Promise<IDtResponse>}
     */
    async getWorkDataTableRecords(body, who) {
        const workDataTable = new WorkOrderDataTable(this.context.db(), MapperFactory.build(MapperFactory.WORK_ORDER), who);
        const editor = await workDataTable.addBody(body).make();
        return editor.data();
    }

    /**
     * Deletes a work order
     *
     * @param by
     * @param value
     * @param who {Session}
     * @returns {*|Promise|PromiseLike<T>|Promise<T>}
     */
    deleteWorkOrder(by = "id", value, who) {
        const WorkOrderMapper = MapperFactory.build(MapperFactory.WORK_ORDER);
        return WorkOrderMapper.deleteDomainRecord({by, value}, true, who).then(count => {
            if (!count) {
                return Utils.buildResponse({status: "fail", data: {message: "The specified record doesn't exist"}});
            }
            return Utils.buildResponse({data: {message: "Work Order deleted"}});
        });
    }

    /**
     * Delete multiple work orders
     *
     * @param ids {Array} ids of the work orders to be deleted
     * @param who {Session}
     * @param by {String}
     * @returns {Promise<*>}
     */
    async deleteMultipleWorkOrder(ids = [], who, by = "id") {
        if (!Array.isArray(ids)) return Promise.reject(Utils.buildResponse({data: {message: "Expected an array of work order id"}}));
        const WorkOrderMapper = MapperFactory.build(MapperFactory.WORK_ORDER);
        const task = ids.map(value => WorkOrderMapper.deleteDomainRecord({by, value}, false, who));
        const items = (await Promise.all(task)).map(([{id}, del]) => ({id, deleted: del > 0}));
        return Utils.buildResponse({data: {items}});
    }

    /**
     *
     * @param query
     * @throws TypeError
     * @returns {*}
     * @private
     */
    buildQuery(query) {
        if (typeof query !== 'object') throw new TypeError("Query parameter must be an object");

        const offset = query.offset || 0,
            limit = query.limit || 10,
            id = query['id'],
            workOderNo = query['work_order_no'],
            relationId = query['relation_id'],
            relationTo = query['related_to'],
            assignedTo = query['assigned_to'],
            createdBy = query['created_by'],
            fromDate = query['from_date'],
            toDate = query['to_date'],
            type = query['type_id'],
            status = query['status'];

        const resultSet = this.context.db().select(['*']).from("work_orders");

        if (id) {
            if (Utils.isWorkOrderNo(id)) resultSet.where('work_order_no', id);
            else resultSet.where('id', id);
        }
        if (fromDate && toDate) resultSet.whereBetween('start_date', [fromDate, toDate]);
        if (assignedTo) resultSet.whereRaw(`JSON_CONTAINS(assigned_to, '{"id":${assignedTo}}')`);
        if (status) resultSet.whereIn('status', status.split(","));
        if (type) resultSet.whereIn("type_id", type.split(","));
        if (createdBy) resultSet.where("created_by", createdBy);
        if (relationId) resultSet.where("relation_id", relationId);
        if (relationTo) resultSet.where("related_to", relationTo);
        if (workOderNo) resultSet.where('work_order_no', 'like', `%${workOderNo}%`);

        resultSet.where('deleted_at', null).limit(Number(limit)).offset(Number(offset)).orderBy("id", "desc");

        return resultSet;
    }
}

/**
 * Called internally when a work order has been created
 *
 * @param workOrder
 * @param body
 * @param who
 * @param files
 * @param API
 * @private
 */
function onWorkOrderCreated(workOrder, body, who, files, API) {
    Utils.convertDataKeyToJson(workOrder, "labels", "assigned_to");
    Events.emit("assign_work_order", workOrder, workOrder.assigned_to, who);

    if (files.length) {
        API.attachments().createAttachment({
            module: this.moduleName,
            relation_id: workOrder.id
        }, who, files, API).then();
    }
    workOrder['created_by'] = {id: who.getAuthUser().getUserId(), username: who.getAuthUser().getUsername()};
}

/**
 *
 * @param workOrder
 * @param model
 * @param who
 * @param files
 * @param API
 */
function onWorkOrderUpdated(workOrder, model, who, files, API) {
    const newAssigned = (workOrder.assigned_to) ? JSON.parse(workOrder.assigned_to) : [];

    const assignees = differenceBy(newAssigned, model.assigned_to, 'id');

    const assignmentPayload = {
        id: model.id,
        work_order_no: model.work_order_no,
        summary: model.summary
    };

    Events.emit("assign_work_order", assignmentPayload, (assignees.length) ? assignees : workOrder.assigned_to, who);
    Events.emit("work_order_updated", workOrder, who, model);

    if (files.length) {
        API.attachments().createAttachment({
            module: "work_orders",
            relation_id: workOrder.id
        }, who, files, API).then();
    }
    Utils.convertDataKeyToJson(workOrder, "labels", "assigned_to");
}


function sweepWorkOrderResponsePayload(workOrder) {
    let keys = Object.keys(workOrder);
    keys.forEach(key => (workOrder[key] == null) ? delete workOrder[key] : undefined);
    const group = workOrder['group'];
    if (workOrder['request_id']) delete workOrder['request_id'];
    if (group && workOrder['group']['children']) delete workOrder['group']['children'];
    if (group && workOrder['group']['parent']) delete workOrder['group']['parent'];
}

/**
 *
 * @param workOrders
 * @param context
 * @param module
 * @param isSingle
 * @private
 */

async function onListWorkOrders(workOrders, context, module, isSingle = false) {
    const [groups, workTypes, faultCategories] = await Promise.all([
        context.getKey("groups", true),
        context.getKey("work:types", true),
        context.getKey("fault:categories", true)
    ]);

    for (const workOrder of workOrders) {
        const workType = workOrder['type_name'] = workTypes[workOrder.type_id].name;
        workOrder['group'] = groups[workOrder['group_id']];

        const promises = [
            workOrder.relatedTo(),
            workOrder.getAssignedUsers(context.db()),
            workOrder.createdBy(),
            ...workOrder.getRelatedRecordCount(context.db())
        ];

        const [
            relatedTo,
            assignedTo,
            createdBy,
            nCount,
            aCount,
            mCount
        ] = await Promise.all(promises).catch(err => (Promise.reject(err)));

        workOrder['notes_count'] = (nCount && nCount[0]) ? nCount[0]['notes_count'] : 0;
        workOrder['attachments_count'] = (aCount && aCount[0]) ? aCount[0]['attachments_count'] : 0;
        workOrder['materials_utilized_count'] = (mCount && mCount[0]) ? mCount[0]['mat_count'] : 0;
        workOrder['assigned_to'] = assignedTo || [];
        workOrder['created_by'] = createdBy.records.shift() || {};

        if (relatedTo && relatedTo.records.length) {
            const relatedModel = relatedTo.records.shift();
            await workOrder.setRelatedModelData(workType, relatedModel);
            if (workOrder['faults']) workOrder['faults'].setCategory(faultCategories);
        }
        workOrder.humanizeWorkOrderNo();
        sweepWorkOrderResponsePayload(workOrder);
    }
    return Utils.buildResponse({data: {items: workOrders}});
}

module.exports = WorkOrderService;
