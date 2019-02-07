/**
 * Created by paulex on 8/22/17.
 */


const ModelMapper = require('../../../../core/model/ModelMapper');


class UploadMapper extends ModelMapper{
    constructor(context) {
        super(context);
        this.primaryKey = "id";
        this.tableName = "uploads";
        this.domainName = "Upload";
    }
}

module.exports = UploadMapper;