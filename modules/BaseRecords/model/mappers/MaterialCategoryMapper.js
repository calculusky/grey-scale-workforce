/**
 * Created by paulex on 03/26/19.
 */


const ModelMapper = require('../../../../core/model/ModelMapper');


class MaterialCategoryMapper extends ModelMapper{
    constructor(context) {
        super(context);
        this.primaryKey = "id";
        this.tableName = "material_categories";
        this.domainName = "MaterialCategory";
    }

    _audit(){}
}

module.exports = MaterialCategoryMapper;