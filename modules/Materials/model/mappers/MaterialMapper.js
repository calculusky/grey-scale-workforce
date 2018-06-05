/**
 * Created by paulex on 06/02/18.
 */


const ModelMapper = require('../../../../core/model/ModelMapper');


class AssetMapper extends ModelMapper {
    constructor(context) {
        super(context);
        this.primaryKey = "id";
        this.tableName = "materials";
        this.domainName = "Material";
    }
}

module.exports = AssetMapper;