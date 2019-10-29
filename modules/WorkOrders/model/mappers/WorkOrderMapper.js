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

        const spot = db.raw('sum(if(status_comment = "Spot Payment" && status IN(7), current_bill, 0)) as spot');
        const pv = db.raw('sum(if(status_comment = "Customer Already Paid" && status IN(7), current_bill, 0)) as pv');
        const total = db.raw('sum(if(status_comment = "Spot Payment" && status IN(7), current_bill, 0) + if(status_comment = "Customer Already Paid" && status NOT IN(7), current_bill, 0)) as total');

        return await dbName
            .join('groups', 'groups.id', '=', 'work_orders.group_id')
            // .join('statuses', 'statuses.id', '=', 'work_orders.status')
            .join('disconnection_billings', 'disconnection_billings.id', '=', 'work_orders.relation_id')
            .select(['work_orders.group_id', 'groups.name', 'work_orders.updated_at'])
            .select([spot, pv, total])
            .count('work_orders.id as dos')
            .where('work_orders.type_id', 1)
            .whereBetween('work_orders.updated_at', [startDate, endDate])
            .groupBy('work_orders.group_id', 'work_orders.updated_at');
    }

    async getQueryDisconnectionOrderByGroup(groupId, startDate, endDate) {
        const db = this.context.database;
        const dbName = db.table(this.tableName);

        const spot = db.raw('sum(if(status_comment = "Spot Payment" && status IN(7), current_bill, 0)) as spot');
        const pv = db.raw('sum(if(status_comment = "Customer Already Paid" && status IN(7), current_bill, 0)) as pv');
        const total = db.raw('sum(if(status_comment = "Spot Payment" && status IN(7), current_bill, 0) + if(status_comment = "Customer Already Paid" && status NOT IN(7), current_bill, 0)) as total');

        return await dbName
            .join('groups', 'groups.id', '=', 'work_orders.group_id')
            .join('group_subs', 'group_subs.child_group_id', '=', 'groups.id')
            .join('disconnection_billings', 'disconnection_billings.id', '=', 'work_orders.relation_id')
            .select(['work_orders.group_id', 'groups.name', 'work_orders.updated_at'])
            .select([spot, pv, total])
            .count('work_orders.work_order_no as dos')
            .where({
                'group_subs.parent_group_id': groupId,
                'work_orders.type_id': 1,
            })
            .whereBetween('work_orders.updated_at', [startDate, endDate])
            .groupBy('work_orders.group_id', 'work_orders.updated_at');
    }

    async getQueryDisconnectionOrderByBu(groupId, buId, startDate, endDate) {
        const db = this.context.database;
        const dbName = db.table(this.tableName);

        const spot = db.raw('sum(if(status_comment = "Spot Payment" && status IN(7), current_bill, 0)) as spot');
        const pv = db.raw('sum(if(status_comment = "Customer Already Paid" && status IN(7), current_bill, 0)) as pv');
        const total = db.raw('sum(if(status_comment = "Spot Payment" && status IN(7), current_bill, 0) + if(status_comment = "Customer Already Paid" && status NOT IN(7), current_bill, 0)) as total');

        return await dbName
            .join('groups', 'groups.id', '=', 'work_orders.group_id')
            .join('group_subs', 'group_subs.child_group_id', '=', 'groups.id')
            .join('disconnection_billings', 'disconnection_billings.id', '=', 'work_orders.relation_id')
            .select(['work_orders.group_id', 'groups.name', 'work_orders.updated_at'])
            .select([spot, pv, total])
            .count('work_orders.work_order_no as dos')
            .where({
                'group_subs.parent_group_id': buId,
                'work_orders.type_id': 1,
            })
            .whereBetween('work_orders.updated_at', [startDate, endDate])
            .groupBy('work_orders.group_id', 'work_orders.updated_at');
    }

    async getQueryDisconnectionOrderByUt(groupId, buId, utId ,startDate, endDate) {
        const db = this.context.database;
        const dbName = db.table(this.tableName);

        const spot = db.raw('sum(if(status_comment = "Spot Payment" && status IN(7), current_bill, 0)) as spot');
        const pv = db.raw('sum(if(status_comment = "Customer Already Paid" && status IN(7), current_bill, 0)) as pv');
        const total = db.raw('sum(if(status_comment = "Spot Payment" && status IN(7), current_bill, 0) + if(status_comment = "Customer Already Paid" && status NOT IN(7), current_bill, 0)) as total');

        return await dbName
            .join('groups', 'groups.id', '=', 'work_orders.group_id')
            .join('group_subs', 'group_subs.child_group_id', '=', 'groups.id')
            .join('disconnection_billings', 'disconnection_billings.id', '=', 'work_orders.relation_id')
            .select(['work_orders.group_id', 'groups.name', 'work_orders.updated_at'])
            .select([spot, pv, total])
            .count('work_orders.work_order_no as dos')
            .where({
                'group_subs.parent_group_id': utId,
                'work_orders.type_id': 1,
            })
            .whereBetween('work_orders.updated_at', [startDate, endDate])
            .groupBy('work_orders.group_id', 'work_orders.updated_at');
    }

    async getQueryStatusLookup(dcFilter, rcFilter) {
        const db = this.context.database;

        return await db.table(this.tableName)
            .join('statuses', 'statuses.id', '=', 'work_orders.status')
            .select(['work_orders.work_order_no','statuses.name', 'work_orders.updated_at', 'work_orders.type_id'])
            .where('work_orders.work_order_no', dcFilter)
            .orWhere('work_orders.work_order_no', rcFilter)
    }
}


module.exports = WorkOrderMapper;