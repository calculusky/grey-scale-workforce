/**
 * Created by paulex on 7/4/17.
 */

const ModelMapper = require('../../../../core/model/ModelMapper');


class NotificationMapper extends ModelMapper{
    constructor(context) {
        super(context);
        this.primaryKey = "id";
        this.tableName = "notifications";
        this.domainName = "Notification";
    }
}

module.exports = NotificationMapper;