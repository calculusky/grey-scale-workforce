/**
 * Created by paulex on 7/5/17.
 */
const ModelMapper = require('../../../../core/model/ModelMapper');
const Utils = require('../../../../core/Utility/Utils');

class WorkOrderMapper extends ModelMapper {

    constructor(context) {
        super(context);
        this.primaryKey = "id";
        this.tableName = "work_orders";
        this.domainName = "WorkOrder";
    }

    // async _audit(data, who, type) {
    //     const newData = {};
    //     //Clone the object so as to not affect the original object
    //     Object.assign(newData, data);
    //     const typeId = newData['type_id'] || 1;
    //     for (const [key, value] of Object.entries(newData)) {
    //         switch (key) {
    //             case 'status': {
    //                 newData[key] = Utils.getWorkStatuses(typeId, value);
    //                 break;
    //             }
    //             case 'type_id': {
    //                 newData[key] = Utils.getWorkOrderType(typeId).name;
    //                 break;
    //             }
    //             case 'group_id': {
    //                 const group = (await Utils.getFromPersistent(this.context, "groups", true))[value];
    //                 newData[key] = group.name;
    //                 break;
    //             }
    //             case 'priority': {
    //                 newData[key] = Utils.getWorkPriorities(1, value);
    //                 break;
    //             }
    //             case 'labels': {
    //                 newData[key] = JSON.parse(value);
    //                 break;
    //             }
    //             case 'assigned_to': {
    //                 newData[key] = JSON.parse(value);
    //                 break;
    //             }
    //             default:
    //                 break;
    //         }
    //     }
    //     super._audit(newData, who, type);
    // }


    async getTotalWorkOderByUserAndStatus(userId, ...statuses) {
        const db = this.context.database;
        return await db.table(this.tableName)
            .select(["status", "type_id"])
            .where(function () {
                this.where("created_by", userId)
                    .orWhereRaw(`JSON_CONTAINS(assigned_to, '[{"id":${userId}}]')`)
            })
            .whereIn("status", statuses);
    }
}

module.exports = WorkOrderMapper;