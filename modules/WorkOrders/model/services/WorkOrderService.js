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
class WorkOrderService{
    
    constructor(){
        
    }

    getName(){
        return "workOrderService";
    }

    getWorkOrders(value, by = "id", who = {api: -1}, offset, limit){
        if (!value || `${""+value+"".trim()}` == '') {
            //Its important that all queries are streamlined to majorly for each business
            value = who.api;
            by = "api_instance_id";
        } else if (value) {
            const temp = value;
            value = {};
            value[by] = temp;
            value['api_instance_id'] = who.api;
            by = "*_and";
        }
        const WorkOrderMapper = MapperFactory.build(MapperFactory.WORK_ORDER);
        return WorkOrderMapper.findDomainRecord({by, value}, offset, limit)
            .then(result=> {
                return (Util.buildResponse({data: {items: result.records}}));
            });
    }
    
    createWorkOrder(body = {}, who = {}){
        const WorkOrder = DomainFactory.build(DomainFactory.WORK_ORDER);
        body['api_instance_id'] = who.api;
        let workOrder = new WorkOrder(body);

        //enforce the validation
        let isValid = validate(workOrder.rules(), workOrder);
        if(!isValid){
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
    
    deleteWorkOrder(by = "id", value){
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