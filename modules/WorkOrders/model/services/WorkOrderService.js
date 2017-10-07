/**
 * Created by paulex on 7/4/17.
 */
let MapperFactory = null;
const DomainFactory = require('../../../DomainFactory');
const Password = require('../../../../core/Utility/Password');
const Util = require('../../../../core/Utility/MapperUtil');
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
        if (by == 'id' && (value && value.substring(0, 1).toUpperCase() == 'W')) {
            by = "work_order_no";
            value = value.replace(/-/g, "");
        }
        var executor = (resolve, reject)=> {
            WorkOrderMapper.findDomainRecord({by, value}, offset, limit, 'created_at', 'desc')
                .then(results=> {
                    const workOrders = results.records;
                    _doWorkOrderList(workOrders, this.context, this.moduleName, resolve, reject, by == 'id');
                    if (!workOrders.length) return resolve(Util.buildResponse({data: {items: results.records}}));
                }).catch(err=> {
                console.log(err);
                return reject(err);
            });
        };
        return new Promise(executor);
    }

    /**
     * Gets list of work orders by date. However this can be used to get workorders regardless of supplying
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
            let resultSet = this.context.database.select(['*']).from("work_orders");
            if (fromDate && toDate) resultSet = resultSet.whereBetween('issue_date', [fromDate, toDate]);
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
                _doWorkOrderList(workOrders, this.context, this.moduleName, resolve, reject, false);
                if (!records.length) return resolve(Util.buildResponse({data: {items: workOrders}}));
            }).catch(err=> {
                const error = Util.buildResponse(Util.getMysqlError(err), 400);
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
            return Promise.reject(Util.buildResponse({status: "fail", data: {message: validate.lastError}}, 400));
        }

        //Get Mapper
        const WorkOrderMapper = MapperFactory.build(MapperFactory.WORK_ORDER);
        // console.log(workOrder);
        return WorkOrderMapper.createDomainRecord(workOrder).then(workOrder=> {
            if (!workOrder) return Promise.reject();
            return Util.buildResponse({data: workOrder});
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
                return Util.buildResponse({data: result.shift()});
            } else {
                return Promise.reject(Util.buildResponse({status: "fail", data: result.shift()}, 404));
            }
        });
    }

    deleteWorkOrder(by = "id", value) {
        const WorkOrderMapper = MapperFactory.build(MapperFactory.WORK_ORDER);
        return WorkOrderMapper.deleteDomainRecord({by, value}).then(count=> {
            if (!count) {
                return Util.buildResponse({status: "fail", data: {message: "The specified record doesn't exist"}});
            }
            return Util.buildResponse({data: {message: "Work Order deleted"}});
        });
    }

}

function sweepWorkOrderResponsePayload(workOrder) {
    var keys = Object.keys(workOrder);
    keys.forEach(key => {
        if (workOrder[key] == null) {
            delete workOrder[key]
        }
    });
}

/**
 *
 * @param workOrders
 * @param context
 * @param moduleName
 * @param resolve
 * @param reject
 * @param isSingle
 * @private
 */
function _doWorkOrderList(workOrders, context, moduleName, resolve, reject, isSingle = false) {
    let rowLen = workOrders.length;
    let processed = 0;
    const workTypes = context.persistence.getItemSync("work_types");
    const groups = context.persistence.getItemSync("groups");
    workOrders.forEach(workOrder=> {
        let promises = [];
        let workType = workOrder['type_name'] = workTypes[workOrder.type_id].name;
        let isAsset = workOrder['related_to'] == 'assets';
        workOrder['group'] = groups[workOrder['group_id']];

        //remove the request_id its irrelevant
        delete workOrder['request_id'];

        //lets get all the related records
        promises.push((workType.toLowerCase() == "disconnection") ? workOrder.disconnection() : null);
        promises.push((isAsset) ? workOrder.asset() : workOrder.customer());

        //if we loading for a list view let's get the counts or related models
        if (!isSingle) {
            let countNotes = context.database.count('note as notes_count').from("notes")
                .where("module", moduleName)
                .where("relation_id", workOrder.id);

            let countAttachments = context.database.count('id as attachments_count')
                .from("attachments")
                .where("module", moduleName)
                .where("relation_id", workOrder.id);
            promises.push(countNotes, countAttachments)
        }

        Promise.all(promises).then(values=> {
            //its compulsory that we check that a record exist
            let type = values[0];
            if (type) {
                let disconnection = type.records.shift();
                delete disconnection['id'];
                delete disconnection['created_at'];
                delete disconnection['updated_at'];
                workOrder['disconnection'] = disconnection;
            }
            let relatedTo = values[1];
            if (relatedTo) {
                let relation = relatedTo.records.shift();
                if (isAsset) {
                    workOrder['relation_name'] = relation.asset_name;
                } else {
                    workOrder['relation_name'] = `${relation.first_name} ${relation.last_name}`;
                    //if the address line is empty and is related to a customer we should use the
                    //customer address
                    workOrder['address_line'] =
                        (!workOrder['address_line'] || workOrder['address_line'].length == 0)
                            ? relation.plain_address : workOrder['address_line'];
                }
            }
            if (values[2] && values[3]) {
                workOrder['notes_count'] = values[2].shift()['notes_count'];
                workOrder['attachments_count'] = values[3].shift()['attachments_count'];
            }
            //end of outer loop
            if (++processed == rowLen) return resolve(Util.buildResponse({data: {items: workOrders}}));
        }).catch(err=> {
            console.log(err);
            return reject(err);
        });
        sweepWorkOrderResponsePayload(workOrder)
    });
}

module.exports = WorkOrderService;