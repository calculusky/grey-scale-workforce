/**
 * Created by paulex on 8/22/17.
 */


const ModelMapper = require('../../../../core/model/ModelMapper');


class NoteMapper extends ModelMapper{
    constructor(context) {
        super(context);
        this.primaryKey = "id";
        this.tableName = "notes";
        this.domainName = "Note";
    }

    _audit(data, who, type){
        const newData = Object.assign({}, data);
        if(newData.location) delete newData.location;
        super._audit(newData, who, type);
    }
}

module.exports = NoteMapper;