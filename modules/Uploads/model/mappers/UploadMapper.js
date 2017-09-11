/**
 * Created by paulex on 8/22/17.
 */


const ModelMapper = require('../../../../core/model/ModelMapper');


class NoteMapper extends ModelMapper{
    constructor(context) {
        super(context);
        this.primaryKey = "id";
        this.tableName = "uploads";
        this.domainName = "Upload";
    }
}

module.exports = NoteMapper;