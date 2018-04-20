const Utils = require('../core/Utility/Utils');

/**
 * @author Paul Okeke
 * @name ApiService
 */
class ApiService {

    constructor(context) {
        this.context = context;
    }

    /**
     *
     * @param data
     * @param who - Basically the user session|json web token
     */
    static insertPermissionRights(data, who) {
        if (!who || !who.sub) return;
        data['created_by'] = who.sub;
        if (!data['group_id']) data['group_id'] = (Array.isArray(who.group)) ? who.group.shift() : 1;
        if (!data['assigned_to'] || data['assigned_to'].length === 0)
            data['assigned_to'] = JSON.stringify(
                [{id: who.sub, 'created_at': Utils.date.dateToMysql(new Date(), 'YYYY-MM-DD H:m:s')}]
            );
    }

}

module.exports = ApiService;