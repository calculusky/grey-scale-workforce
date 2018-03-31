/**
 * Created by paulex on 7/4/17.
 */
const ApiService = require('../../../ApiService');
const DomainFactory = require('../../../DomainFactory');
const Utils = require('../../../../core/Utility/Utils');
const validate = require('validatorjs');
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
    getWorkOrders(value = '?', by = "id", who = {api: -1}, offset, limit) {
        const WorkOrderMapper = MapperFactory.build(MapperFactory.WORK_ORDER);
        //check if it is a work order number that is supplied
        if (by === 'id' && (typeof value !== 'object' && Utils.isWorkOrderNo(value))) {
            by = "work_order_no";
            value = value.replace(/-/g, "");
        }
        //If the value is in type of an object we can say the request
        //is not for fetching just a single work order
        const isSingle = typeof value !== 'object';
        let executor = (resolve, reject) => {
            //Prepare the static data from persistence storage
            let {groups, workTypes} = [{}, {}];
            this.context.persistence.get("groups", (err, grps) => {
                if (!err) groups = JSON.parse(grps);
            });

            this.context.persistence.get("work:types", (err, types) => {
                if (!err) workTypes = JSON.parse(types);
            });

            WorkOrderMapper.findDomainRecord({by, value}, offset, limit, 'created_at', 'desc')
                .then(results => {
                    const workOrders = results.records;
                    _doWorkOrderList(workOrders,
                        this.context, this.moduleName,
                        resolve, reject,
                        isSingle, groups,
                        workTypes || this.fallBackType
                    );
                    if (!workOrders.length) return resolve(Utils.buildResponse({data: {items: results.records}}));
                }).catch(err => {
                return reject(err);
            });
        };
        return new Promise(executor);
    }

    /**
     * Gets list of work orders by date. However this can be used to get work-orders regardless of supplying
     * the dates.
     * @param userId
     * @param status
     * @param fromDate
     * @param toDate
     * @param who
     * @param offset
     * @param limit
     */
    getWorkOrdersBetweenDates(userId, status, fromDate, toDate, offset = 0, limit = 10, who = {}) {
        offset = parseInt(offset);
        limit = parseInt(limit);
        let executor = (resolve, reject) => {
            //Prepare the static data from persistence storage
            let {groups, workTypes} = [{}, {}];
            this.context.persistence.get("groups", (err, grps) => {
                if (!err) groups = JSON.parse(grps)
            });

            this.context.persistence.get("work:types", (err, types) => {
                if (!err) workTypes = JSON.parse(types);
            });

            let resultSet = this.context.database.select(['*']).from("work_orders");
            if (fromDate && toDate) resultSet = resultSet.whereBetween('start_date', [fromDate, toDate]);
            if (userId) resultSet = resultSet.whereRaw(`JSON_CONTAINS(assigned_to, '{"id":${userId}}')`);
            if (status) resultSet = resultSet.where('status', status);
            resultSet = resultSet.where('deleted_at', null).limit(limit).offset(offset).orderBy("id", "desc");
            resultSet.then(records => {
                let workOrders = [];
                const WorkOrder = DomainFactory.build(DomainFactory.WORK_ORDER);
                records.forEach(record => {
                    let domain = new WorkOrder(record);
                    domain.serialize(undefined, "client");
                    workOrders.push(domain);
                });
                // Process the work order list
                _doWorkOrderList(workOrders,
                    this.context, this.moduleName,
                    resolve, reject, false,
                    groups,
                    workTypes || this.fallBackType
                );
                //
                if (!records.length) return resolve(Utils.buildResponse({data: {items: workOrders}}));
            }).catch(err => {
                const error = Utils.buildResponse(Utils.getMysqlError(err), 400);
                return Promise.reject(error);
            });
        };
        return new Promise(executor);
    }

    /**
     *
     * @param body
     * @param who
     * @returns {*}
     */
    createWorkOrder(body = {}, who = {}) {
        const WorkOrder = DomainFactory.build(DomainFactory.WORK_ORDER);
        let workOrder = new WorkOrder(body);

        //enforce the validation
        let validator = new validate(workOrder, workOrder.rules(), workOrder.customErrorMessages());
        if (validator.fails()) {
            return Promise.reject(Utils.buildResponse({
                status: "fail",
                data: validator.errors.all(),
                code: 'VALIDATION_ERROR'
            }, 400));
        }

        ApiService.insertPermissionRights(workOrder, who);

        const executor = (resolve, reject) => {
            this.context.persistence.get("groups", (err, groups) => {
                if (err) return;
                groups = JSON.parse(groups);
                let userGroup = groups[workOrder.group_id];
                // If the group actually doesn't exist then we can return this as a false request
                if (!userGroup) return Promise.reject(Utils.buildResponse(
                    {status: "fail", data: {message: "Group specified doesn't exist"}}, 400
                ));

                // If this current user group doesn't have business unit as parent
                // then the user's current group or the specified group will be used.
                let businessUnit = Utils.getGroupParent(userGroup, 'business_unit') || userGroup;

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
    switch (typeId) {
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
 * @param moduleName
 * @param resolve
 * @param reject
 * @param isSingle
 * @param groups
 * @param workTypes
 * @private
 */
function _doWorkOrderList(workOrders, context, moduleName, resolve, reject, isSingle = false, groups, workTypes) {
    let rowLen = workOrders.length;
    let processed = 0;

    workOrders.forEach(workOrder => {
        let promises = [];

        let workType = workOrder['type_name'] = workTypes[workOrder.type_id].name;
        workOrder['group'] = groups[workOrder['group_id']];

        //Get the entity related to this work order
        promises.push(workOrder.relatedTo());

        //If we're loading for a list view let's get the counts of notes, attachments etc.
        if (!isSingle) {
            let countNotes = context.database.count('note as notes_count').from("notes")
                .where("module", moduleName).where("relation_id", workOrder.id);

            let countAttachments = context.database.count('id as attachments_count').from("attachments")
                .where("module", moduleName).where("relation_id", workOrder.id);

            promises.push(countNotes, countAttachments);
        }
        //Promises in order of possible arrangement
        //0: The related Entity e.g faults, disconnection_billing
        //1: Notes Count
        //2: Attachments Count
        Promise.all(promises).then(values => {
            //its compulsory that we check that a record exist
            const relatedToRecord = values[0];
            const notesCount = values[1];
            const attachmentCount = values[2];

            if (notesCount && attachmentCount) {
                workOrder['notes_count'] = notesCount.shift()['notes_count'];
                workOrder['attachments_count'] = attachmentCount.shift()['attachments_count'];
            }

            let wait = false;

            //First thing lets get the work order type details
            if (relatedToRecord && relatedToRecord.records.length) {
                let relatedModel = relatedToRecord.records.shift();
                if (relatedModel) {
                    delete relatedModel['id'];
                    delete relatedModel['created_at'];
                    delete relatedModel['updated_at'];
                }

                workOrder[workType.toLowerCase()] = relatedModel;

                switch (workOrder.related_to.toLowerCase()) {
                    case "disconnection_billings":
                        wait = true;
                        //We know that a disconnection billing is related
                        //To a customer so we need to get the customer details.
                        relatedModel.customer().then(customer => {
                            wait = false;
                            workOrder['customer'] = customer.records.shift();
                            if (!wait) {
                                sweepWorkOrderResponsePayload(workOrder);
                                if (++processed === rowLen) {
                                    return resolve(Utils.buildResponse({data: {items: workOrders}}));
                                }
                            }
                        });
                        break;
                    case "faults":

                        break;
                }
            }
            if (!wait) {
                sweepWorkOrderResponsePayload(workOrder);
                if (++processed === rowLen) {
                    return resolve(Utils.buildResponse({data: {items: workOrders}}));
                }
            }
        }).catch(err => {
            console.log(err);
            return reject(err);
        });
        //remove the request_id its irrelevant
        workOrder['work_order_no'] = Utils.humanizeUniqueSystemNumber(workOrder['work_order_no']);
    });
}

module.exports = WorkOrderService;