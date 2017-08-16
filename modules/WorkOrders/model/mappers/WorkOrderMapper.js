/**
 * Created by paulex on 7/5/17.
 */
const ModelMapper = require('../../../../core/model/ModelMapper');

class WorkOrderMapper extends ModelMapper{

    constructor(context){
        super(context);
        this.primaryKey = "id";
        this.tableName = "work_orders";
        this.domainName = "WorkOrder";
    }
}

module.exports = WorkOrderMapper;