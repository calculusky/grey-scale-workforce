/**
 * Created by paulex on 7/4/17.
 */
let MapperFactory = null;
const DomainFactory = require('../../../DomainFactory');
const Utils = require('../../../../core/Utility/Utils');
const validate = require('validate-fields')();

/**
 * @name WorkOrderService
 */
class WorkOrderService {

    constructor(context) {
        this.context = context;
        MapperFactory = this.context.modelMappers;
        this.moduleName = "work_orders";
    }

    getName() {
        return "workOrderService";
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
        if (by == 'id' && (typeof value != 'object' && value && value.substring(0, 1).toUpperCase() == 'W')) {
            by = "work_order_no";
            value = value.replace(/-/g, "");
        }
        console.log(value);
        var executor = (resolve, reject)=> {
            //Prepare the static data from persistence storage
            let {groups, workTypes} = [{}, {}];
            this.context.persistence.get("groups", (err, grps)=> {
                if (!err) groups = JSON.parse(grps);
            });

            this.context.persistence.get("work:types", (err, types)=> {
                if (!err) workTypes = JSON.parse(types);
            });

            WorkOrderMapper.findDomainRecord({by, value}, offset, limit, 'created_at', 'desc')
                .then(results=> {
                    console.log(results.query);
                    const workOrders = results.records;
                    _doWorkOrderList(workOrders, this.context, this.moduleName, resolve, reject, by == 'id', groups, workTypes);
                    if (!workOrders.length) return resolve(Utils.buildResponse({data: {items: results.records}}));
                }).catch(err=> {
                console.log(err);
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
        var executor = (resolve, reject)=> {
            //Prepare the static data from persistence storage
            let {groups, workTypes} = [{}, {}];
            this.context.persistence.get("groups", (err, grps)=> {
                if (!err) groups = JSON.parse(grps)
            });

            this.context.persistence.get("work:types", (err, types)=> {
                if (!err) workTypes = JSON.parse(types);
            });

            let resultSet = this.context.database.select(['*']).from("work_orders");
            if (fromDate && toDate) resultSet = resultSet.whereBetween('start_date', [fromDate, toDate]);
            if (userId) resultSet = resultSet.whereRaw(`JSON_CONTAINS(assigned_to, '{"id":${userId}}')`);
            if (status) resultSet = resultSet.where('status', status);
            resultSet = resultSet.where('deleted_at', null).limit(limit).offset(offset).orderBy("id", "desc");
            resultSet.then(records=> {
                let workOrders = [];
                const WorkOrder = DomainFactory.build(DomainFactory.WORK_ORDER);
                records.forEach(record => {
                    let domain = new WorkOrder(record);
                    domain.serialize(undefined, "client");
                    workOrders.push(domain);
                });
                _doWorkOrderList(workOrders, this.context, this.moduleName, resolve, reject, false, groups, workTypes);
                if (!records.length) return resolve(Utils.buildResponse({data: {items: workOrders}}));
            }).catch(err=> {
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
        body['api_instance_id'] = who.api;
        let workOrder = new WorkOrder(body);

        //enforce the validation
        let isValid = validate(workOrder.rules(), workOrder);
        if (!isValid) {
            return Promise.reject(Utils.buildResponse({status: "fail", data: {message: validate.lastError}}, 400));
        }

        //Get Mapper
        const WorkOrderMapper = MapperFactory.build(MapperFactory.WORK_ORDER);
        return WorkOrderMapper.createDomainRecord(workOrder).then(workOrder=> {
            if (!workOrder) return Promise.reject();
            return Utils.buildResponse({data: workOrder});
        });
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
        return WorkOrderMapper.updateDomainRecord({value: orderId, domain: workOrder}).then(result=> {
            if (result.pop()) {
                return Utils.buildResponse({data: result.shift()});
            } else {
                return Promise.reject(Utils.buildResponse({status: "fail", data: result.shift()}, 404));
            }
        });
    }

    deleteWorkOrder(by = "id", value) {
        const WorkOrderMapper = MapperFactory.build(MapperFactory.WORK_ORDER);
        return WorkOrderMapper.deleteDomainRecord({by, value}).then(count=> {
            if (!count) {
                return Utils.buildResponse({status: "fail", data: {message: "The specified record doesn't exist"}});
            }
            return Utils.buildResponse({data: {message: "Work Order deleted"}});
        });
    }

}

function sweepWorkOrderResponsePayload(workOrder) {
    var keys = Object.keys(workOrder);
    keys.forEach(key => {
        if (workOrder[key] == null) {
            delete workOrder[key]
        }
        if (key == 'customer') {
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

    workOrders.forEach(workOrder=> {
        let promises = [];

        let workType = workOrder['type_name'] = workTypes[workOrder.type_id].name;
        workOrder['group'] = groups[workOrder['group_id']];

        //Get the related work order type details
        switch (workType.toLowerCase()) {
            case "disconnection":
                promises.push(workOrder.disconnection());
                break;
            case "re-connection":
                promises.push(null);
                break;
            default:
                promises.push(null);
                break;
        }

        //get the related entity details
        switch (workOrder['related_to'].toLowerCase()) {
            case "customers":
                promises.push(workOrder.customer());
                break;
            case "work_orders":
                promises.push(workOrder.workOrder());
                break;
            case "assets":
                promises.push(workOrder.asset());
                break;
            default:
                promises.push(null);
                break;
        }

        //If we're loading for a list view let's get the counts or related models
        if (!isSingle) {
            let countNotes = context.database.count('note as notes_count').from("notes")
                .where("module", moduleName).where("relation_id", workOrder.id);

            let countAttachments = context.database.count('id as attachments_count').from("attachments")
                .where("module", moduleName).where("relation_id", workOrder.id);

            promises.push(countNotes, countAttachments)
        }
        //Promises in order of arrangement
        //0: The work order type related details
        //1: The related Entity e.g customer or assets
        //2: Notes Count
        //3: Attachments Count
        Promise.all(promises).then(values=> {
            //its compulsory that we check that a record exist
            const typeEntity = values[0];
            const relatedEntity = values[1];
            const notesCount = values[2];
            const attachmentCount = values[3];

            let wait = false;

            //First thing lets get the work order type details
            if (typeEntity) {
                let typeDetails = typeEntity.records.shift();
                if (typeDetails) {
                    delete typeDetails['id'];
                    delete typeDetails['created_at'];
                    delete typeDetails['updated_at'];
                }
                workOrder[workType.toLowerCase()] = typeDetails;
            }
            //Secondly We need to get the relatedEntity Details
            if (relatedEntity) {
                let relatedEntityDetails = relatedEntity.records.shift();
                switch (workOrder['related_to'].toLowerCase()) {
                    case "assets":
                        workOrder['relation_name'] = relatedEntityDetails.asset_name;
                        break;
                    case "customers":
                        workOrder['customer'] = relatedEntityDetails;
                        break;
                    //Work-Order to Work Order is Peculiar to IE alone
                    case "work_orders":
                        wait = true;
                        workOrder['work_order'] = {
                            id: relatedEntityDetails.id,
                            work_order_no: relatedEntityDetails.work_order_no,
                            type_id: relatedEntityDetails.type_id,
                            type_name: "Disconnection",
                            related_to: relatedEntityDetails.related_to,
                            relation_id: relatedEntityDetails.relation_id,
                            status: relatedEntityDetails.status,
                            priority: relatedEntityDetails.priority
                        };
                        //Load all other necessary details
                        Promise.all([
                            relatedEntityDetails.customer(),
                            relatedEntityDetails.disconnection(),
                            relatedEntityDetails.payment()]
                        ).then(pValues=> {
                            wait = false;
                            let thisCustomer = pValues[0].records.shift();
                            let thisDisconnection = pValues[1].records.shift();
                            let thisPayment = pValues[2].records.shift();
                            workOrder['customer'] = thisCustomer;
                            workOrder['disconnection'] = {
                                current_bill: thisDisconnection.current_bill,
                                arrears: thisDisconnection.arrears,
                                min_amount_payable: thisDisconnection.min_amount_payable,
                                total_amount_payable: thisDisconnection.total_amount_payable,
                                amount_paid: (thisPayment) ? thisPayment.amount : 0.0
                            };
                            if (!wait) {
                                sweepWorkOrderResponsePayload(workOrder);
                                if (++processed == rowLen)
                                    return resolve(Utils.buildResponse({data: {items: workOrders}}));
                            }
                        });
                        break;
                    default:
                        break;
                }
            }
            if (notesCount && attachmentCount) {
                workOrder['notes_count'] = notesCount.shift()['notes_count'];
                workOrder['attachments_count'] = attachmentCount.shift()['attachments_count'];
            }
            if (!wait) {
                sweepWorkOrderResponsePayload(workOrder);
                if (++processed == rowLen) {
                    return resolve(Utils.buildResponse({data: {items: workOrders}}));
                }
            }
        }).catch(err=> {
            return reject(err);
        });
        //remove the request_id its irrelevant
        workOrder['work_order_no'] = Utils.humanizeUniqueSystemNumber(workOrder['work_order_no']);
    });
}

module.exports = WorkOrderService;