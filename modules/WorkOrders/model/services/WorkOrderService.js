/**
 * Created by paulex on 7/4/17.
 */
const ApiService = require('../../../ApiService');
const DomainFactory = require('../../../DomainFactory');
const Utils = require('../../../../core/Utility/Utils');
const validate = require('validatorjs');
const Error = require('../../../../core/Utility/ErrorUtils')();
const _ = require("lodash");
const Events = require('../../../../events/events');
const ExportQuery = require('../WorkOrderExportQuery');
let MapperFactory = null;

/**
 * @name WorkOrderService
 */
class WorkOrderService extends ApiService {

    constructor(context) {
        super(context);
        MapperFactory = this.context.modelMappers;
        this.moduleName = "work_orders";
        // Note this is irrelevant but also relevant
        // It is used only when redis fails in a split seconds to
        // respond with the work order types
        this.fallBackType = {
            '1': {id: 1, name: 'Disconnections'},
            '2': {id: 2, name: 'Re-connections'},
            '3': {id: 3, name: 'Faults'}
        };
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
    async getWorkOrder(value = '?', by = "id", who = {}, offset, limit) {
        const WorkOrderMapper = MapperFactory.build(MapperFactory.WORK_ORDER);
        //check if it is a work order number that is supplied
        if (by === 'id' && (typeof value !== 'object' && Utils.isWorkOrderNo(value))) {
            by = "work_order_no";
            value = value.replace(/-/g, "");
        }
        //If the value is in type of an object we can say the request
        //is not for fetching just a single work order
        const isSingle = typeof value !== 'object';

        //Prepare the static data from persistence storage
        let [groups, workTypes, faultCategories] = await Promise.all([
            Utils.getFromPersistent(this.context, "groups", true),
            Utils.getFromPersistent(this.context, "work:types", true),
            Utils.getFromPersistent(this.context, "fault:categories", true)
        ]);

        workTypes = (workTypes) ? workTypes : this.fallBackType;

        const results = await WorkOrderMapper.findDomainRecord({by, value}, offset, limit, 'created_at', 'desc')
            .catch(err => {
                return Promise.reject(err)
            });
        const workOrders = results.records;

        if (!workOrders.length) return Utils.buildResponse({data: {items: results.records}});

        const extras = {groups, workTypes, faultCategories, includes: ["fault", "billing"]};
        return _doWorkOrderList(workOrders, this.context, this.moduleName, isSingle, extras);
    }

    /**
     *
     * @param by
     * @param value
     * @param body
     * @param who
     * @param files
     * @param API
     * @returns {Promise<void>|*}
     */
    async updateWorkOrder(by, value, body = {}, who, files = [], API) {
        const WorkOrder = DomainFactory.build(DomainFactory.WORK_ORDER);
        const WorkOrderMapper = MapperFactory.build(MapperFactory.WORK_ORDER);
        const model = (await WorkOrderMapper.findDomainRecord({by, value})).records.shift();

        if (!model) return Promise.reject(Error.RecordNotFound("Work Order doesn't exist."));

        const workOrder = new WorkOrder(body);
        const newAssignees = Utils.serializeAssignedTo(workOrder.assigned_to);

        if (workOrder.assigned_to) workOrder.assigned_to = Utils.updateAssigned(model.assigned_to, newAssignees);

        /*The work order type is needed for auditing*/
        if (!workOrder.type_id) workOrder.type_id = model.type_id;

        return WorkOrderMapper.updateDomainRecord({value, domain: workOrder}, who).then(result => {
            const assignees = _.differenceBy((workOrder.assigned_to) ? JSON.parse(workOrder.assigned_to) : [], model.assigned_to, 'id');
            Events.emit("assign_work_order",
                {id: model.id, work_order_no: model.work_order_no, summary: model.summary},
                (assignees.length) ? assignees : workOrder.assigned_to, who);

            Events.emit("work_order_updated", workOrder, who, model);

            if (files.length) {
                API.attachments().createAttachment({
                    module: "work_orders",
                    relation_id: workOrder.id
                }, who, files, API).then();
            }
            const updatedRec = result.shift();
            Utils.convertDataKeyToJson(updatedRec, "labels", "assigned_to");
            return Utils.buildResponse({data: updatedRec});
        });
    }

    /**
     * Gets list of work orders by date. However this can be used to get work-orders regardless of supplying
     * the dates.
     * @param query
     * @param who
     */
    async getWorkOrders(query, who = {}) {
        const offset = query.offset || 0,
            limit = query.limit || 10,
            workOderNo = query['work_order_no'],
            relationId = query['relation_id'],
            relationTo = query['related_to'],
            assignedTo = query['assigned_to'],
            createdBy = query['created_by'],
            fromDate = query['from_date'],
            toDate = query['to_date'],
            type = query['type_id'],
            status = query['status'];

        let includes = query['include'] || ["fault", "billing"];//by default we'd request for fault and billing
        if (typeof includes === "string") includes = includes.split(',');

        //Prepare the static data from persistence storage
        let [groups, workTypes, faultCategories] = await Promise.all([
            Utils.getFromPersistent(this.context, "groups", true),
            Utils.getFromPersistent(this.context, "work:types", true),
            Utils.getFromPersistent(this.context, "fault:categories", true)
        ]);

        let resultSet = this.context.database.select(['*']).from("work_orders");

        if (fromDate && toDate) resultSet.whereBetween('start_date', [fromDate, toDate]);
        if (assignedTo) resultSet.whereRaw(`JSON_CONTAINS(assigned_to, '{"id":${assignedTo}}')`);
        if (status) resultSet.whereIn('status', status.split(","));
        if (type) resultSet.whereIn("type_id", type.split(","));
        if (createdBy) resultSet.where("created_by", createdBy);
        if (relationId) resultSet.where("relation_id", relationId);
        if (relationTo) resultSet.where("related_to", relationTo);
        if (workOderNo) resultSet.where('work_order_no', 'like', `%${workOderNo}%`);

        resultSet.where('deleted_at', null).limit(Number(limit)).offset(Number(offset)).orderBy("id", "desc");
        const records = await resultSet.catch(err => {
            return Promise.reject(Utils.buildResponse(Utils.getMysqlError(err), 400));
        });


        let workOrders = [];
        const WorkOrder = DomainFactory.build(DomainFactory.WORK_ORDER);
        records.forEach(record => {
            let domain = new WorkOrder(record);
            domain.serialize(undefined, "client");
            workOrders.push(domain);
        });

        if (!records.length) return Utils.buildResponse({data: {items: workOrders}});

        // Process the work order list
        const extras = {groups, workTypes, faultCategories, includes};
        return _doWorkOrderList(workOrders, this.context, this.moduleName, false, extras).catch(console.error);
    }


    /**
     * We are majorly searching for work order
     * @param keyword
     * @param offset
     * @param limit
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
        let resultSets = this.context.database.select(fields).from('work_orders')
            .where('work_order_no', 'like', `%${keyword}%`).where("deleted_at", null)
            .limit(parseInt(limit)).offset(parseInt(offset)).orderBy('work_order_no', 'asc');

        const results = await resultSets.catch(err => (Utils.buildResponse({status: "fail", data: err}, 500)));
        let workOrders = results.map(item => {
            return new WorkOrder(item);
        });
        return Utils.buildResponse({data: {items: workOrders}});
    }


    /**
     *
     * @param workOrderId
     * @param query
     * @param who
     * @returns {Promise<{data?: *, code?: *}>}
     */
    async getWorkOrderMaterialRequisitions(workOrderId, query = {}, who = {}) {
        const db = this.context.database;
        const records = await db.table("material_requisitions").where("work_order_id", workOrderId);
        const MaterialRequisition = DomainFactory.build(DomainFactory.MATERIAL_REQUISITION);
        const materialCols = [
            'id', 'name', 'unit_of_measurement',
            'unit_price', 'total_quantity',
            'created_at', 'updated_at', 'assigned_to'
        ], requisitions = [];

        for (let requisition of records) {
            requisition = new MaterialRequisition(requisition);
            const [materials, assignedTo] = await Promise.all([
                Utils.getModels(db, "materials", requisition['materials'], materialCols),
                Utils.getAssignees(requisition.assigned_to || [], db)
            ]);
            requisition.materials = materials.map((mat, i) => {
                mat.qty = requisition.materials[i]['qty'];
                return mat;
            });
            requisition.assigned_to = assignedTo;
            requisitions.push(requisition);
        }

        let response = requisitions;

        if (query['includeOnly'] && query['includeOnly'] === "materials") {
            response = [];
            requisitions.forEach(req => response.push(req.materials));
            response = _.flattenDeep(response);
            return Utils.buildResponse({data: {items: response, work_order_id: workOrderId}});
        }
        return Utils.buildResponse({data: {items: response}});
    }


    /**
     *
     * @param body
     * @param who
     * @param files
     * @param {API} API
     * @returns {*}
     */
    async createWorkOrder(body = {}, who = {}, files = [], API) {
        const WorkOrder = DomainFactory.build(DomainFactory.WORK_ORDER);
        let workOrder = new WorkOrder(body);

        workOrder.assigned_to = Utils.serializeAssignedTo(workOrder.assigned_to);

        //enforce the validation
        if (!workOrder.validate) return Promise.reject(Error.ValidationFailure(workOrder.errors.all()));

        ApiService.insertPermissionRights(workOrder, who);

        const groups = await Utils.getFromPersistent(this.context, "groups", true).catch(_ => (Promise.reject(Error.InternalServerError)));

        const group = groups[workOrder.group_id];

        if (!group) return Promise.reject(Error.GroupNotFound);

        let bu = Utils.getGroupParent(group, 'business_unit') || group;

        const uniqueNo = await Utils.generateUniqueSystemNumber(
            _prefix(workOrder.type_id),
            bu['short_name'],
            'work_orders',
            this.context
        ).catch(_ => (Promise.reject(Error.InternalServerError)));

        workOrder.work_order_no = uniqueNo.toUpperCase();

        const WorkOrderMapper = MapperFactory.build(MapperFactory.WORK_ORDER);

        workOrder = await WorkOrderMapper.createDomainRecord(workOrder).catch(err => (Promise.reject(err)));

        Utils.convertDataKeyToJson(workOrder, "labels", "assigned_to");

        Events.emit("work_order_added", workOrder, who);
        Events.emit("assign_work_order", workOrder, workOrder.assigned_to, who);


        if (files.length) {
            API.attachments().createAttachment({
                module: "work_orders",
                relation_id: workOrder.id
            }, who, files, API).then();
        }
        workOrder['created_by'] = {id: who.sub, username: who.name};
        return Utils.buildResponse({data: workOrder});
    }

    /**
     *
     * @param value - The Work Order Id
     * @param status
     * @param note
     * @param files
     * @param who
     * @param API {API}
     * @returns {Promise.<WorkOrder>|*}
     */
    async changeWorkOrderStatus(value/*WorkOrderId*/, status, who = {}, note, files = [], API) {
        const updated = await this.updateWorkOrder("id", value, {status}, who, [], API);
        if (note) API.notes().createNote(note, who, files, API).catch(console.error);
        return updated;
    }

    /**
     *
     * @param query
     * @param who
     * @param API
     * @returns {Promise<void>}
     */
    async exportWorkOrders(query, who = {}, API) {
        const WorkOrderMapper = MapperFactory.build(MapperFactory.WORK_ORDER);
        const exportWorkOrderQuery = new ExportQuery(query, WorkOrderMapper, who, API);
        const groups = await Utils.getFromPersistent(this.context, "groups", true);
        return exportWorkOrderQuery.setGroups(groups).export().catch(err => {
            console.error(err);
            return Utils.buildResponse({status: "fail", data: {message: "There was an error fetching the export"}});
        });
    }

    /**
     * Deletes a work order
     *
     * @param by
     * @param value
     * @param who
     * @returns {*|Promise|PromiseLike<T>|Promise<T>}
     */
    deleteWorkOrder(by = "id", value, who = {}) {
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
     * @param ids
     * @param who
     * @param by
     * @returns {Promise<*>}
     */
    async deleteMultipleWorkOrder(ids = [], who = {}, by = "id") {
        if (!Array.isArray(ids)) return Promise.reject(Utils.buildResponse({data: {message: "Expected an array of work order id"}}));
        const WorkOrderMapper = MapperFactory.build(MapperFactory.WORK_ORDER);
        const task = ids.map(value => WorkOrderMapper.deleteDomainRecord({by, value}, false, who));
        const items = (await Promise.all(task)).map(([{id}, del]) => ({id, deleted: del > 0}));
        return Utils.buildResponse({data: {items}});
    }
}

function _prefix(typeId) {
    if (!typeId) return "W";
    switch (parseInt(typeId)) {
        case 1:
            return "D";
        case 2:
            return "R";
        case 3:
            return "F";
    }
    return "W";
}

function sweepWorkOrderResponsePayload(workOrder) {
    let keys = Object.keys(workOrder);
    keys.forEach(key => (workOrder[key] == null) ? delete workOrder[key] : undefined);
    if (workOrder['request_id']) delete workOrder['request_id'];
    if (workOrder['group']['children']) delete workOrder['group']['children'];
    if (workOrder['group']['parent']) delete workOrder['group']['parent'];
}

/**
 *
 * @param workOrders
 * @param context
 * @param module
 * @param isSingle
 * @param groups
 * @param workTypes
 * @param faultCategories
 * @param includes
 * @private
 */

async function _doWorkOrderList(workOrders, context, module, isSingle = false, {groups, workTypes, faultCategories, includes = []}) {
    const db = context.database;
    for (let workOrder of workOrders) {

        let promises = [];

        let workType = workOrder['type_name'] = workTypes[workOrder.type_id].name;
        workOrder['group'] = groups[workOrder['group_id']];

        //Get the entity related to this work order
        if ((workOrder.related_to === "faults" && includes.includes("fault"))
            || (workOrder.related_to === "disconnection_billings" && includes.includes("billing"))) {
            promises.push(workOrder.relatedTo(workOrder.related_to))
        } else promises.push(null);

        promises.push(Utils.getAssignees(workOrder.assigned_to, db), workOrder.createdBy());

        //If we're loading for a list view let's get the counts of notes, attachments etc.
        if (!isSingle) {
            let nNotes = db.count('note as notes_count').from("notes")
                .where("module", module).where("relation_id", workOrder.id);

            let nAttachments = db.count('id as attachments_count').from("attachments")
                .where("module", module).where("relation_id", workOrder.id);

            let utilizedCount = db.count("id as mat_count").from("material_utilizations")
                .where("work_order_id", workOrder.id);

            promises.push(nNotes, nAttachments, utilizedCount);
        }

        const [relatedTo, assignedTo, createdBy, nCount, aCount, mCount] = await Promise.all(promises).catch(err => {
            return Promise.reject(err);
        });
        //its compulsory that we check that a record exist
        if (nCount && aCount) {
            workOrder['notes_count'] = nCount.shift()['notes_count'];
            workOrder['attachments_count'] = aCount.shift()['attachments_count'];
            workOrder['materials_utilized_count'] = mCount.shift()['mat_count'];
        }

        if (assignedTo) workOrder.assigned_to = assignedTo;
        if (createdBy) workOrder.created_by = createdBy.records.shift();

        //First thing lets get the work order type details
        if (relatedTo && relatedTo.records.length) {
            let relatedModel = relatedTo.records.shift();
            if (relatedModel) {
                // delete relatedModel['created_at'];
                delete relatedModel['updated_at'];
            }
            workOrder[workType.toLowerCase()] = relatedModel;
            switch (workOrder.related_to.toLowerCase()) {
                case "disconnection_billings":
                    const [customer, plan] = await Promise.all([relatedModel.customer(), relatedModel.paymentPlan()]);
                    workOrder['customer'] = customer.records.shift() || {};
                    workOrder['payment_plans'] = plan.records;
                    break;
                case "faults":
                    if (relatedModel.related_to.toLowerCase() === "assets") {
                        const asset = await relatedModel.asset();
                        workOrder['faults']['asset'] = asset.records.shift() || {};
                    } else if (relatedModel.related_to.toLowerCase() === "customers") {
                        const cus = await relatedModel.customer();
                        workOrder['faults']['customer'] = cus.records.shift() || {};
                    }
                    workOrder['faults']['category'] = faultCategories[workOrder['faults']['category_id']];
                    delete workOrder['faults']['category_id'];
                    break;
            }
        }
        sweepWorkOrderResponsePayload(workOrder);
        workOrder['work_order_no'] = Utils.humanizeUniqueSystemNumber(workOrder['work_order_no']);
    }
    return Utils.buildResponse({data: {items: workOrders}});
}

module.exports = WorkOrderService;
