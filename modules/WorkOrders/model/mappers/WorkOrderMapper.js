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

    async getQueryDisconnectionOrder(startDate, endDate) {
        const db = this.context.database;
        const dbName = db.table(this.tableName);

        const spot = db.raw('sum(disconnection_billings.current_bill + disconnection_billings.arrears) as spot');
        const pv = db.raw('sum(disconnection_billings.total_amount_payable + disconnection_billings.reconnection_fee) as pv');
        const total = db.raw('sum(disconnection_billings.current_bill + disconnection_billings.arrears + disconnection_billings.total_amount_payable + disconnection_billings.reconnection_fee) as total');

        const results = await dbName
            .join('groups', 'groups.id', '=', 'work_orders.group_id')
            .join('disconnection_billings', 'disconnection_billings.id', '=', 'work_orders.relation_id')
            .select(['work_orders.group_id', 'groups.name', 'work_orders.issue_date'])
            .select([spot, pv, total])
            .count('work_orders.work_order_no as dos')
            .where('work_orders.type_id', 1)
            .whereBetween('work_orders.issue_date', [startDate, endDate])
            .groupBy('work_orders.group_id', 'work_orders.issue_date');

        return results;
    }

    async getQueryDisconnectionOrderByGroup(groupId, startDate, endDate) {
        const db = this.context.database;
        const dbName = db.table(this.tableName);

        const spot = db.raw('sum(disconnection_billings.current_bill + disconnection_billings.arrears) as spot');
        const pv = db.raw('sum(disconnection_billings.total_amount_payable + disconnection_billings.reconnection_fee) as pv');
        const total = db.raw('sum(disconnection_billings.current_bill + disconnection_billings.arrears + disconnection_billings.total_amount_payable + disconnection_billings.reconnection_fee) as total');

        const results = await dbName
            .join('groups', 'groups.id', '=', 'work_orders.group_id')
            .join('group_subs', 'group_subs.child_group_id', '=', 'groups.id')
            .join('disconnection_billings', 'disconnection_billings.id', '=', 'work_orders.relation_id')
            .select(['work_orders.group_id', 'groups.name', 'work_orders.issue_date'])
            .select([spot, pv, total])
            .count('work_orders.work_order_no as dos')
            .where('group_subs.parent_group_id', groupId)
            .whereIn('work_orders.type_id', [1])
            .whereBetween('work_orders.issue_date', [startDate, endDate])
            .groupBy('work_orders.group_id', 'work_orders.issue_date');

        return results;
    }
}


module.exports = WorkOrderMapper;