const Utils = require('../core/Utility/Utils');
const {isEmpty} = require("lodash");

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
     * @param who {Session}
     */
    static insertPermissionRights(data, who) {
        if (!who || !who.getAuthUser()) return;
        const authUser = who.getAuthUser();
        data['created_by'] = authUser.getUserId();
        if (!data['group_id']) data['group_id'] = authUser.getGroups()[0] || 1;

        let assignedTo = data['assigned_to'];
        const setDefaultAssignedTo = () => {
            data['assigned_to'] = JSON.stringify([
                {id: authUser.getUserId(), 'created_at': Utils.date.dateToMysql(new Date(), 'YYYY-MM-DD H:m:s')}
            ]);
        };
        if (typeof assignedTo === "string" && (assignedTo === "[]" || assignedTo.length === 0)) setDefaultAssignedTo();
        else if (!assignedTo || assignedTo.length === 0) setDefaultAssignedTo();
    }

    /**
     * Checks if the user is permitted to particular permission key(s)
     *
     * @param who {Session}
     * @param keys
     */
    static hasPermissions(who, ...keys) {
        if (!who) return false;
        const permission = who.getAuthUser().getPermission();
        if (!permission || isEmpty(permission)) return false;
        let permitted = true;
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (!permission.hasOwnProperty(key)) permitted = false;
            if ([false, 'false', 'none'].includes(permission[key])) permitted = false;
        }
        return permitted;
    }

    /**
     *
     * @param key
     * @param dbQuery
     * @param modelMapper
     * @param who
     */
    static queryWithPermissions(key, dbQuery, modelMapper, who) {
        if (!ApiService.hasPermissions(who, key)) return dbQuery;
        const permType = who.getAuthUser().getPermission()[key];
        const table = modelMapper.tableName;
        const userId = who.getAuthUser().getUserId(), groups = who.getPermittedGroups();

        switch (permType) {
            case 'group': {
                const groupCol = (table !== "groups") ? `${table}.group_id` : `${table}.id`;
                dbQuery.where(builder => {
                    builder.whereIn(groupCol, groups)
                        .orWhere(`${table}.created_by`, userId)
                        .orWhereRaw(`JSON_CONTAINS(${table}.assigned_to, '{"id":${userId}}')`);
                });
                return dbQuery;
            }
            case "owner": {
                dbQuery.where(builder => {
                    builder.where(`${table}.created_by`, userId)
                        .orWhereRaw(`JSON_CONTAINS(${table}.assigned_to, '{"id":${userId}}')`);
                });
                return dbQuery;
            }
            case "all": {
                return dbQuery;
            }
            case "none": {
                return dbQuery.where(modelMapper.primaryKey, null);
            }
        }
    }
}

module.exports = ApiService;