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
     * @param who - Basically the user session|json web token
     */
    static insertPermissionRights(data, who) {
        if (!who || !who.sub) return;
        data['created_by'] = who.sub;
        if (!data['group_id']) data['group_id'] = (Array.isArray(who.group)) ? who.group[0] : 1;

        let assignedTo = data['assigned_to'];
        const setDefaultAssignedTo = () => {
            data['assigned_to'] = JSON.stringify([
                {id: who.sub, 'created_at': Utils.date.dateToMysql(new Date(), 'YYYY-MM-DD H:m:s')}
            ]);
        };
        if (typeof assignedTo === "string" && (assignedTo === "[]" || assignedTo.length === 0)) setDefaultAssignedTo();
        else if (!assignedTo || assignedTo.length === 0) setDefaultAssignedTo();
    }

    /**
     *
     * @param who
     * @param keys
     */
    static hasPermissions(who, ...keys) {
        if (who && (!who.permissions || isEmpty(who.permissions))) return false;
        let permitted = true;
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (!who.permissions.hasOwnProperty(key)) permitted = false;
            if ([false, 'false', 'none'].includes(who.permissions[key])) permitted = false;
        }
        console.log("Permitted:", permitted);
        return permitted;
    }

    /**
     *
     * @param key
     * @param knexQuery
     * @param modelMapper
     * @param who
     */
    static queryWithPermissions(key, knexQuery, modelMapper, who) {
        if (!ApiService.hasPermissions(who, key)) return knexQuery;
        const permType = who.permissions[key];
        const table = modelMapper.tableName;
        switch (permType) {
            case 'group': {
                const groupCol = (table !== "groups") ? `${table}.group_id` : `${table}.id`;
                knexQuery.where(builder => {
                    builder.whereIn(groupCol, Array.isArray(who.group) ? who.group : [])
                        .orWhere(`${table}.created_by`, who.sub)
                        .orWhereRaw(`JSON_CONTAINS(${table}.assigned_to, '{"id":${who.sub}}')`);
                });
                return knexQuery;
            }
            case "owner":{
                knexQuery.where(builder => {
                    builder.where(`${table}.created_by`, who.sub)
                        .orWhereRaw(`JSON_CONTAINS(${table}.assigned_to, '{"id":${who.sub}}')`);
                });
                return knexQuery;
            }
            case "all":{
                return knexQuery;
            }
            case "none":{
                return knexQuery.where(modelMapper.primaryKey, null);
            }
        }
    }
}

module.exports = ApiService;