/**
 * Created by paulex on 7/4/17.
 */
const DomainFactory = require('../../../DomainFactory');
const MapperFactory = require('../../../MapperFactory');
const Password = require('../../../../core/Utility/Password');
const Util = require('../../../../core/Utility/MapperUtil');
const validate = require('validate-fields')();

/**
 * @name WorkOrderService
 */
class WorkOrderService {

    constructor(context) {
        this.context = context;
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
                    let workTypes = this.context.persistence.getItemSync("work_types");
                    console.log(results);
                    workOrders.forEach(workOrder=> {
                        let workType = workOrder['type_name'] = workTypes[workOrder.type_id].name;
                        let promises = [];
                        let isAsset = workOrder['related_to'] == 'assets';
                        
                        promises.push((workType.toLowerCase() == "disconnection")
                            ? workOrder.disconnection() : workOrder.reconnection());
                        
                        promises.push((isAsset) ? workOrder.asset() : workOrder.customer());

                        Promise.all(promises).then(values=> {
                            //its compulsory that we check that a record exist
                            let relatedModel = values.shift().records.shift();
                            if (relatedModel && isAsset) {
                                workOrder['relation_name'] = relatedModel.asset_name;
                            } else if (relatedModel) {
                                workOrder['relation_name'] = `${relatedModel.first_name} ${relatedModel.last_name}`;
                            }
                            if (++processed == rowLen)
                                return resolve(Util.buildResponse({data: {items: workOrders}}));
                        }).catch(err=> {
                            console.log(err);
                            return reject(err);
                        });
                    });
                    if (!rowLen) return resolve(Util.buildResponse({data: {items: results.records}}));
                }).catch(err=> {
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