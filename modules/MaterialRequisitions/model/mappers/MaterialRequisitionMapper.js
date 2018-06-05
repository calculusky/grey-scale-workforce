/**
 * Created by paulex on 8/22/17.
 */


const ModelMapper = require('../../../../core/model/ModelMapper');


class MaterialRequisitionMapper extends ModelMapper {
    constructor(context) {
        super(context);
        this.primaryKey = "id";
        this.tableName = "material_requisitions";
        this.domainName = "MaterialRequisition";
    }
}

module.exports = MaterialRequisitionMapper;