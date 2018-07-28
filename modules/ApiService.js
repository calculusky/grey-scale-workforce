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

        let assignedTo = data['assigned_to'];
        const setDefaultAssignedTo = () => {
            data['assigned_to'] = JSON.stringify([
                {id: who.sub, 'created_at': Utils.date.dateToMysql(new Date(), 'YYYY-MM-DD H:m:s')}
            ]);
        };
        if (typeof assignedTo === "string" && assignedTo === "[]" || assignedTo.length === 0) setDefaultAssignedTo();
        else if (!assignedTo || assignedTo.length === 0) setDefaultAssignedTo();
    }
}

module.exports = ApiService;