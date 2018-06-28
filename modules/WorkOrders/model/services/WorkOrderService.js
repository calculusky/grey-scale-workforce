/**
 * Created by paulex on 7/4/17.
 */
const ApiService = require('../../../ApiService');
const DomainFactory = require('../../../DomainFactory');
const Utils = require('../../../../core/Utility/Utils');
const validate = require('validatorjs');
const Error = require('../../../../core/Utility/ErrorUtils')();
const _ = require("lodash");
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
        let [groups, workTypes] = await Promise.all([
            Utils.getFromPersistent(this.context, "groups", true),
            Utils.getFromPersistent(this.context, "work:types", true)
        ]);

        const results = await WorkOrderMapper.findDomainRecord({by, value}, offset, limit, 'created_at', 'desc')
            .catch(err => {
                return Promise.reject(err)
            });
        const workOrders = results.records;

        if (!workOrders.length) return Utils.buildResponse({data: {items: results.records}});

        return _doWorkOrderList(workOrders, this.context, this.moduleName, isSingle, groups, workTypes || this.fallBackType);
    }

    /**
     *
     * @param by
     * @param value
     * @param body
     * @param who
     * @param file
     * @param API
     * @returns {Promise<void>|*}
     */
    async updateWorkOrder(by, value, body = {}, who, file, API) {
        const WorkOrder = DomainFactory.build(DomainFactory.WORK_ORDER);
        const WorkOrderMapper = MapperFactory.build(MapperFactory.WORK_ORDER);
        let model = await this.context.database.table("work_orders").where(by, value).select(['assigned_to']);

        if (!model.length) return Utils.buildResponse({
            status: "fail",
            data: {message: "Work Order doesn't exist"}
        }, 400);

        model = new WorkOrder(model.shift());

        const workOrder = new WorkOrder(body);

        if (workOrder.assigned_to)
            workOrder.assigned_to = Utils.updateAssigned(model.assigned_to, Utils.serializeAssignedTo(workOrder.assigned_to));

        return WorkOrderMapper.updateDomainRecord({value, domain: workOrder}).then(result => {
            return Utils.buildResponse({data: result.shift()});
        });
    }

    /**
     * Gets list of work orders by date. However this can be used to get work-orders regardless of supplying
     * the dates.
     * @param query
     * @param who
     */
    async getWorkOrders(query, who = {}) {
        const offset = parseInt(query.offset || "0"),
            limit = parseInt(query.limit || "10"),
            assignedTo = query['assigned_to'],
            createdBy = query['created_by'],
            fromDate = query['from_date'],
            toDate = query['to_date'],
            type = query['type_id'],
            status = query['status'];


        //Prepare the static data from persistence storage
        let [groups, workTypes] = await Promise.all([
            Utils.getFromPersistent(this.context, "groups", true),
            Utils.getFromPersistent(this.context, "work:types", true)
        ]);

        let resultSet = this.context.database.select(['*']).from("work_orders");
        if (fromDate && toDate) resultSet.whereBetween('start_date', [fromDate, toDate]);
        if (assignedTo) resultSet.whereRaw(`JSON_CONTAINS(assigned_to, '{"id":${assignedTo}}')`);
        if (status) resultSet.whereIn('status', status.split(","));
        if (type) resultSet.whereIn("type_id", type.split(","));
        if (createdBy) resultSet.where("created_by", createdBy);

        resultSet = resultSet.where('deleted_at', null).limit(limit).offset(offset).orderBy("id", "desc");
        console.log(resultSet.toString());
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
        return _doWorkOrderList(workOrders, this.context, this.moduleName, false, groups, workTypes || this.fallBackType)
            .catch(console.error);
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
     * @returns {*}
     */
    createWorkOrder(body = {}, who = {}) {
        console.log('body', body);
        const WorkOrder = DomainFactory.build(DomainFactory.WORK_ORDER);
        let workOrder = new WorkOrder(body);

        workOrder.assigned_to = Utils.serializeAssignedTo(workOrder.assigned_to);

        //enforce the validation
        let validator = new validate(workOrder, workOrder.rules(), workOrder.customErrorMessages());

        if (validator.fails()) return Promise.reject(Error.ValidationFailure(validator.errors.all()));

        ApiService.insertPermissionRights(workOrder, who);

        const executor = (resolve, reject) => {
            this.context.persistence.get("groups", (err, groups) => {
                if (err) return;
                groups = JSON.parse(groups);
                const group = groups[workOrder.group_id];
                // If the group actually doesn't exist then we can return this as a false request
                if (!group) return Promise.reject(Utils.buildResponse(
                    {status: "fail", data: {message: "Group specified doesn't exist"}}, 400
                ));

                // If this current user group doesn't have business unit as parent
                // then the user's current group or the specified group will be used.
                let businessUnit = Utils.getGroupParent(group, 'business_unit') || group;

                Utils.generateUniqueSystemNumber(
                    getNumberPrefix(workOrder.type_id), businessUnit['short_name'], 'work_orders', this.context
                ).then(uniqueNo => {
                    //Get Mapper
                    workOrder.work_order_no = uniqueNo;
                    const WorkOrderMapper = MapperFactory.build(MapperFactory.WORK_ORDER);
                    WorkOrderMapper.createDomainRecord(workOrder).then(workOrder => {
                        if (!workOrder) return reject();
                        return resolve(Utils.buildResponse({data: workOrder}));
                    }).catch(err => {
                        return reject(err);
                    });
                });
            });
        };
        return new Promise(executor);
    }

    /**
     *
     * @param orderId
     * @param status
     * @returns {Promise.<WorkOrder>|*}
     */
    changeWorkOrderStatus(orderId, status) {
        const WorkOrder = DomainFactory.build(DomainFactory.WORK_ORDER);
        let workOrder = new WorkOrder();

        workOrder.status = status;

        const WorkOrderMapper = MapperFactory.build(MapperFactory.WORK_ORDER);
        return WorkOrderMapper.updateDomainRecord({value: orderId, domain: workOrder}).then(result => {
            if (result.pop()) {
                return Utils.buildResponse({data: result.shift()});
            } else {
                return Promise.reject(Utils.buildResponse({status: "fail", data: result.shift()}, 404));
            }
        });
    }

    deleteWorkOrder(by = "id", value) {
        const WorkOrderMapper = MapperFactory.build(MapperFactory.WORK_ORDER);
        return WorkOrderMapper.deleteDomainRecord({by, value}).then(count => {
            if (!count) {
                return Utils.buildResponse({status: "fail", data: {message: "The specified record doesn't exist"}});
            }
            return Utils.buildResponse({data: {message: "Work Order deleted"}});
        });
    }

}

function getNumberPrefix(typeId) {
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
    keys.forEach(key => {
        if (workOrder[key] == null) {
            delete workOrder[key]
        }
        if (key === 'customer') {
            delete workOrder['customer']['first_name'];
            delete workOrder['customer']['last_name'];
            delete workOrder['customer']['status'];
            delete workOrder['customer']['deleted_at'];
            delete workOrder['customer']['created_at'];
            delete workOrder['customer']['updated_at'];
            delete workOrder['customer']['meter_type'];
            delete workOrder['customer']['meter_status'];
            delete workOrder['customer']['tariff'];
            delete workOrder['customer']['address_id'];
            delete workOrder['customer']['group_id'];
        }
    });
    if (workOrder['request_id']) {
        delete workOrder['request_id'];
    }
}

/**
 *
 * @param workOrders
 * @param context
 * @param module
 * @param isSingle
 * @param groups
 * @param workTypes
 * @private
 */
async function _doWorkOrderList(workOrders, context, module, isSingle = false, groups, workTypes) {
    const db = context.database;
    for (let workOrder of workOrders) {
        let promises = [];

        let workType = workOrder['type_name'] = workTypes[workOrder.type_id].name;
        workOrder['group'] = groups[workOrder['group_id']];

        //Get the entity related to this work order
        promises.push(workOrder.relatedTo());

        //If we're loading for a list view let's get the counts of notes, attachments etc.
        if (!isSingle) {
            let countNotes = db.count('note as notes_count').from("notes")
                .where("module", module).where("relation_id", workOrder.id);

            let countAttachments = db.count('id as attachments_count').from("attachments")
                .where("module", module).where("relation_id", workOrder.id);

            promises.push(countNotes, countAttachments);
        }

        const [relatedToRecord, notesCount, attachmentCount] = await Promise.all(promises).catch(err => {
            console.log(err);
            return Promise.reject(err);
        });
        //its compulsory that we check that a record exist
        if (notesCount && attachmentCount) {
            workOrder['notes_count'] = notesCount.shift()['notes_count'];
            workOrder['attachments_count'] = attachmentCount.shift()['attachments_count'];
        }

        //First thing lets get the work order type details
        if (relatedToRecord && relatedToRecord.records.length) {
            let relatedModel = relatedToRecord.records.shift();
            if (relatedModel) {
                delete relatedModel['created_at'];
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
                    break;
            }
        }
        sweepWorkOrderResponsePayload(workOrder);
        workOrder['work_order_no'] = Utils.humanizeUniqueSystemNumber(workOrder['work_order_no']);
    }
    return Utils.buildResponse({data: {items: workOrders}});
}

module.exports = WorkOrderService;
