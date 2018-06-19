/**
 * Created by paulex on 06/17/18.
 */


const ModelMapper = require('../../../../core/model/ModelMapper');


class MaterialUtilizationMapper extends ModelMapper {
    constructor(context) {
        super(context);
        this.primaryKey = "id";
        this.tableName = "material_utilizations";
        this.domainName = "MaterialUtilization";
    }
}

module.exports = MaterialUtilizationMapper;