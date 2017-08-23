/**
 * Created by paulex on 8/22/17.
 */


const ModelMapper = require('../../../../core/model/ModelMapper');


class AttachmentMapper extends ModelMapper{
    constructor(context) {
        super(context);
        this.primaryKey = "id";
        this.tableName = "attachments";
        this.domainName = "Attachment";
    }
}

module.exports = AttachmentMapper;