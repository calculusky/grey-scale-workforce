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
        var executor = (resolve, reject)=> {
            WorkOrderMapper.findDomainRecord({by, value}, offset, limit, 'created_at', 'desc')
                .then(results=> {
                    const workOrders = results.records;
                    let rowLen = workOrders.length;
                    let processed = 0;
                    const workTypes = this.context.persistence.getItemSync("work_types");
                    const groups = this.context.persistence.getItemSync("groups");
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
                                    //if the address line is empty and is related to a customer we should use the customer address
                                    workOrder['address_line'] = (!workOrder['address_line'] || workOrder['address_line'].length == 0)
                                        ? relation.plain_address : workOrder['address_line'];
                                }
                            }
                            //end of outer loop
                            if (++processed == rowLen) return resolve(Util.buildResponse({data: {items: workOrders}}));
                        }).catch(err=> {
                            console.log(err);
                            return reject(err);
                        });
                    });
                    if (!rowLen) return resolve(Util.buildResponse({data: {items: results.records}}));
                }).catch(err=> {
                console.log(err);
                return reject(err);
            });
        };
        return new Promise(executor);
    }

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

module.exports = WorkOrderService;