/**
 * Created by paulex on 7/5/17.
 */
const ModelMapper = require('../../../../core/model/ModelMapper');

class WorkOrderMapper extends ModelMapper {

    constructor(context) {
        super(context);
        this.primaryKey = "id";
        this.tableName = "work_orders";
        this.domainName = "WorkOrder";
    }


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