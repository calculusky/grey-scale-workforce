/**
 * Created by paulex on 6/03/18.
 */


const ModelMapper = require('../../../../core/model/ModelMapper');


class MaterialLocationMapper extends ModelMapper {
    constructor(context) {
        super(context);
        this.primaryKey = "id";
        this.tableName = "material_locations";
        this.domainName = "MaterialLocation";
    }
}

module.exports = MaterialLocationMapper;