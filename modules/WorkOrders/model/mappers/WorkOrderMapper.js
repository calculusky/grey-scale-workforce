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
        const total = db.raw('sum(if(status_comment = "Spot Payment" && status IN(7), current_bill, 0) + if(status_comment = "Customer Already Paid" && status IN(7), current_bill, 0)) as total');

        return await dbName
            .join('groups', 'groups.id', '=', 'work_orders.group_id')
            // .join('statuses', 'statuses.id', '=', 'work_orders.status')
            .join('disconnection_billings', 'disconnection_billings.id', '=', 'work_orders.relation_id')
            .select([
                'work_orders.group_id', 'groups.name',
                spot, pv, total,
                'work_orders.updated_at'
            ])
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
        const total = db.raw('sum(if(status_comment = "Spot Payment" && status IN(7), current_bill, 0) + if(status_comment = "Customer Already Paid" && status IN(7), current_bill, 0)) as total');

        return await dbName
            .join('groups', 'groups.id', '=', 'work_orders.group_id')
            .join('group_subs', 'group_subs.child_group_id', '=', 'groups.id')
            .join('disconnection_billings', 'disconnection_billings.id', '=', 'work_orders.relation_id')
            .select([
                'work_orders.group_id', 'groups.name',
                spot, pv, total,
                'work_orders.updated_at'
            ])
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
        const total = db.raw('sum(if(status_comment = "Spot Payment" && status IN(7), current_bill, 0) + if(status_comment = "Customer Already Paid" && status IN(7), current_bill, 0)) as total');

        return await dbName
            .join('groups', 'groups.id', '=', 'work_orders.group_id')
            .join('group_subs', 'group_subs.child_group_id', '=', 'groups.id')
            .join('disconnection_billings', 'disconnection_billings.id', '=', 'work_orders.relation_id')
            .select(['work_orders.group_id', 'groups.name', spot, pv, total, 'work_orders.updated_at'])
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
        const total = db.raw('sum(if(status_comment = "Spot Payment" && status IN(7), current_bill, 0) + if(status_comment = "Customer Already Paid" && status IN(7), current_bill, 0)) as total');

        return await dbName
            .join('groups', 'groups.id', '=', 'work_orders.group_id')
            .join('group_subs', 'group_subs.child_group_id', '=', 'groups.id')
            .join('disconnection_billings', 'disconnection_billings.id', '=', 'work_orders.relation_id')
            .select([
                'work_orders.group_id', 'groups.name',
                spot, pv, total,
                'work_orders.updated_at'
            ])
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

    async getQueryPerformanceIndices(startDate, endDate) {
        const db = this.context.database;
        const dbName = db.table(this.tableName);

        const dos_gen = db.raw('sum(if(type_id = 1, 1, 0)) as dos_gen');
        const ros_gen = db.raw('sum(if(type_id = 2, 1, 0)) as ros_gen');
        const dos_cmp = db.raw('sum(if(type_id = 1 && status IN(4, 6), 1, 0)) as dos_cmp');
        const ros_cmp = db.raw('sum(if(type_id = 2 && status IN(4, 6), 1, 0)) as ros_cmp');
        const dos_pnd = db.raw('sum(if(type_id = 1 && status IN(3), 1, 0)) as dos_pnd');
        const ros_pnd = db.raw('sum(if(type_id = 2 && status IN(3), 1, 0)) as ros_pnd');

        return await dbName
            .join('groups', 'groups.id', '=', 'work_orders.group_id')
            .select([
                'work_orders.group_id', 'groups.name',
                dos_gen, ros_gen,
                dos_cmp, ros_cmp,
                dos_pnd, ros_pnd,
                'work_orders.updated_at'
            ])
            .where('groups.type', 'business_unit')
            .whereBetween('work_orders.updated_at', [startDate, endDate])
            .groupBy('work_orders.group_id', 'work_orders.updated_at');
    }

    async getQueryPerformanceIndicesByBu(buId, startDate, endDate) {
        const db = this.context.database;
        const dbName = db.table(this.tableName);

        const dos_gen = db.raw('sum(if(type_id = 1, 1, 0)) as dos_gen');
        const ros_gen = db.raw('sum(if(type_id = 2, 1, 0)) as ros_gen');
        const dos_cmp = db.raw('sum(if(type_id = 1 && status IN(4, 6), 1, 0)) as dos_cmp');
        const ros_cmp = db.raw('sum(if(type_id = 2 && status IN(4, 6), 1, 0)) as ros_cmp');
        const dos_pnd = db.raw('sum(if(type_id = 1 && status IN(3), 1, 0)) as dos_pnd');
        const ros_pnd = db.raw('sum(if(type_id = 2 && status IN(3), 1, 0)) as ros_pnd');

        return await dbName
            .join('groups', 'groups.id', '=', 'work_orders.group_id')
            .join('group_subs', 'group_subs.child_group_id', '=', 'groups.id')
            .select([
                'work_orders.group_id', 'groups.name',
                dos_gen, ros_gen,
                dos_cmp, ros_cmp,
                dos_pnd, ros_pnd,
                'work_orders.updated_at'
            ])
            .where('group_subs.parent_group_id', buId)
            .whereBetween('work_orders.updated_at', [startDate, endDate])
            .groupBy('work_orders.group_id', 'work_orders.updated_at');
    }

    async getQueryPerformanceIndicesByUt(buId, utId, startDate, endDate) {
        const db = this.context.database;
        const dbName = db.table(this.tableName);

        const dos_gen = db.raw('sum(if(type_id = 1, 1, 0)) as dos_gen');
        const ros_gen = db.raw('sum(if(type_id = 2, 1, 0)) as ros_gen');
        const dos_cmp = db.raw('sum(if(type_id = 1 && status IN(4, 6), 1, 0)) as dos_cmp');
        const ros_cmp = db.raw('sum(if(type_id = 2 && status IN(4, 6), 1, 0)) as ros_cmp');
        const dos_pnd = db.raw('sum(if(type_id = 1 && status IN(3), 1, 0)) as dos_pnd');
        const ros_pnd = db.raw('sum(if(type_id = 2 && status IN(3), 1, 0)) as ros_pnd');

        return await dbName
            .join('groups', 'groups.id', '=', 'work_orders.group_id')
            .join('group_subs', 'group_subs.child_group_id', '=', 'groups.id')
            .select([
                'work_orders.group_id', 'groups.name',
                dos_gen, ros_gen,
                dos_cmp, ros_cmp,
                dos_pnd, ros_pnd,
                'work_orders.updated_at'
            ])
            .where('group_subs.parent_group_id', utId)
            .whereBetween('work_orders.updated_at', [startDate, endDate])
            .groupBy('work_orders.group_id', 'work_orders.updated_at');
    }

    async getQueryDoPerformance(startDate, endDate) {
        const db = this.context.database;
        const dbName = db.table(this.tableName);

        return await dbName
            .join('groups', 'groups.id', '=', 'work_orders.group_id')
            .join('statuses', 'statuses.id', '=', 'work_orders.status')
            .select(['work_orders.group_id', 'groups.name', 'work_orders.updated_at'])
            .count('work_orders.id as quantity')
            .where({
                'work_orders.type_id': 1,
                'work_orders.status': 3,
                'statuses.name': 'Disconnected'
            })
            .whereBetween('work_orders.updated_at', [startDate, endDate])
            .groupBy('work_orders.group_id', 'work_orders.updated_at');
    }

    async getQueryDoPerformanceByBu(groupId, startDate, endDate) {
        const db = this.context.database;
        const dbName = db.table(this.tableName);

        return await dbName
            .join('groups', 'groups.id', '=', 'work_orders.group_id')
            .join('group_subs', 'group_subs.child_group_id', '=', 'groups.id')
            .join('statuses', 'statuses.id', '=', 'work_orders.status')
            .select(['work_orders.group_id', 'groups.name', 'work_orders.updated_at'])
            .count('work_orders.id as quantity')
            .where({
                'work_orders.type_id': 1,
                'group_subs.parent_group_id': groupId,
                'work_orders.status': 3,
                'statuses.name': 'Disconnected'
            })
            .whereBetween('work_orders.updated_at', [startDate, endDate])
            .groupBy('work_orders.group_id', 'work_orders.updated_at');
    }

    async getQueryDoPerformanceByUt(groupId, utId, startDate, endDate) {
        const db = this.context.database;
        const dbName = db.table(this.tableName);

        return await dbName
            .join('groups', 'groups.id', '=', 'work_orders.group_id')
            .join('group_subs', 'group_subs.child_group_id', '=', 'groups.id')
            .join('statuses', 'statuses.id', '=', 'work_orders.status')
            .select(['work_orders.group_id', 'groups.name', 'work_orders.updated_at'])
            .count('work_orders.id as quantity')
            .where({
                'work_orders.type_id': 1,
                'group_subs.parent_group_id': utId,
                'work_orders.status': 3,
                'statuses.name': 'Disconnected'
            })
            .whereBetween('work_orders.updated_at', [startDate, endDate])
            .groupBy('work_orders.group_id', 'work_orders.updated_at');
    }

    async getQueryDoPerformanceByGang(groupId, utId, gangId, startDate, endDate) {
        const db = this.context.database;
        const dbName = db.table(this.tableName);

        return await dbName
            .join('groups', 'groups.id', '=', 'work_orders.group_id')
            .join('group_subs', 'group_subs.child_group_id', '=', 'groups.id')
            .join('statuses', 'statuses.id', '=', 'work_orders.status')
            .select(['work_orders.group_id', 'groups.name', 'work_orders.updated_at'])
            .count('work_orders.id as quantity')
            .where({
                'work_orders.type_id': 1,
                'group_subs.parent_group_id': gangId,
                'work_orders.status': 3,
                'statuses.name': 'Disconnected'
            })
            .whereBetween('work_orders.updated_at', [startDate, endDate])
            .groupBy('work_orders.group_id', 'work_orders.updated_at');
    }

    async getQueryRoPerformance(startDate, endDate) {
        const db = this.context.database;
        const dbName = db.table(this.tableName);

        return await dbName
            .join('groups', 'groups.id', '=', 'work_orders.group_id')
            .join('statuses', 'statuses.id', '=', 'work_orders.status')
            .select(['work_orders.group_id', 'groups.name', 'work_orders.updated_at'])
            .count('work_orders.id as quantity')
            .where({
                'work_orders.type_id': 1,
                'work_orders.status': 3,
                'statuses.name': 'Disconnected'
            })
            .whereBetween('work_orders.updated_at', [startDate, endDate])
            .groupBy('work_orders.group_id', 'work_orders.updated_at');
    }

    async getQueryRoPerformanceByBu(groupId, startDate, endDate) {
        const db = this.context.database;
        const dbName = db.table(this.tableName);

        return await dbName
            .join('groups', 'groups.id', '=', 'work_orders.group_id')
            .join('group_subs', 'group_subs.child_group_id', '=', 'groups.id')
            .join('statuses', 'statuses.id', '=', 'work_orders.status')
            .select(['work_orders.group_id', 'groups.name', 'work_orders.updated_at'])
            .count('work_orders.id as quantity')
            .where({
                'work_orders.type_id': 1,
                'group_subs.parent_group_id': groupId,
                'work_orders.status': 3,
                'statuses.name': 'Disconnected'
            })
            .whereBetween('work_orders.updated_at', [startDate, endDate])
            .groupBy('work_orders.group_id', 'work_orders.updated_at');
    }

    async getQueryRoPerformanceByUt(groupId, utId, startDate, endDate) {
        const db = this.context.database;
        const dbName = db.table(this.tableName);

        return await dbName
            .join('groups', 'groups.id', '=', 'work_orders.group_id')
            .join('group_subs', 'group_subs.child_group_id', '=', 'groups.id')
            .join('statuses', 'statuses.id', '=', 'work_orders.status')
            .select(['work_orders.group_id', 'groups.name', 'work_orders.updated_at'])
            .count('work_orders.id as quantity')
            .where({
                'work_orders.type_id': 1,
                'group_subs.parent_group_id': utId,
                'work_orders.status': 3,
                'statuses.name': 'Disconnected'
            })
            .whereBetween('work_orders.updated_at', [startDate, endDate])
            .groupBy('work_orders.group_id', 'work_orders.updated_at');
    }

    async getQueryRoPerformanceByGang(groupId, utId, gangId, startDate, endDate) {
        const db = this.context.database;
        const dbName = db.table(this.tableName);

        return await dbName
            .join('groups', 'groups.id', '=', 'work_orders.group_id')
            .join('group_subs', 'group_subs.child_group_id', '=', 'groups.id')
            .join('statuses', 'statuses.id', '=', 'work_orders.status')
            .select(['work_orders.group_id', 'groups.name', 'work_orders.updated_at'])
            .count('work_orders.id as quantity')
            .where({
                'work_orders.type_id': 1,
                'group_subs.parent_group_id': gangId,
                'work_orders.status': 3,
                'statuses.name': 'Disconnected'
            })
            .whereBetween('work_orders.updated_at', [startDate, endDate])
            .groupBy('work_orders.group_id', 'work_orders.updated_at');
    }

    async getQueryClassification(startDate, endDate) {
        const db = this.context.database;
        const dbName = db.table(this.tableName);

        const dcs = db.raw('sum(if(type_id = 1, 1, 0)) as dcs');
        const rcs = db.raw('sum(if(type_id = 2, 1, 0)) as rcs');
        const total = db.raw('count(*) as total');

        return await dbName
            .join('disconnection_billings', 'disconnection_billings.id', '=', 'work_orders.relation_id')
            .join('customers', 'customers.account_no', '=', 'disconnection_billings.account_no')
            .select([
                'customers.customer_type',
                dcs, rcs, total,
                'work_orders.updated_at'
            ])
            .whereBetween('work_orders.updated_at', [startDate, endDate])
            .groupBy('customers.customer_type', 'work_orders.updated_at');
    }

    async getQueryClassificationByType(customerType, startDate, endDate) {
        const db = this.context.database;
        const dbName = db.table(this.tableName);

        const dcs = db.raw('sum(if(type_id = 1, 1, 0)) as dcs');
        const rcs = db.raw('sum(if(type_id = 2, 1, 0)) as rcs');
        const total = db.raw('count(*) as total');

        return await dbName
            .join('groups', 'groups.id', '=', 'work_orders.group_id')
            .join('disconnection_billings', 'disconnection_billings.id', '=', 'work_orders.relation_id')
            .join('customers', 'customers.account_no', '=', 'disconnection_billings.account_no')
            .select([
                'groups.id', 'groups.name',
                'customers.customer_type',
                dcs, rcs, total,
                'work_orders.updated_at'
            ])
            .where({
                'groups.type': 'business_unit',
                'customers.customer_type': customerType,
            })
            .whereBetween('work_orders.updated_at', [startDate, endDate])
            .groupBy('groups.name', 'customers.customer_type', 'work_orders.updated_at');
    }

    async getQueryClassificationByBu(customerType, buId, startDate, endDate) {
        const db = this.context.database;
        const dbName = db.table(this.tableName);

        const dcs = db.raw('sum(if(type_id = 1, 1, 0)) as dcs');
        const rcs = db.raw('sum(if(type_id = 2, 1, 0)) as rcs');
        const total = db.raw('count(*) as total');

        return await dbName
            .join('groups', 'groups.id', '=', 'work_orders.group_id')
            .join('group_subs', 'group_subs.child_group_id', '=', 'groups.id')
            .join('disconnection_billings', 'disconnection_billings.id', '=', 'work_orders.relation_id')
            .join('customers', 'customers.account_no', '=', 'disconnection_billings.account_no')

            .select([
                'groups.id', 'groups.name',
                'customers.customer_type',
                dcs, rcs, total,
                'work_orders.updated_at'
            ])
            .where({
                'group_subs.parent_group_id': buId,
                'customers.customer_type': customerType,
            })
            .whereBetween('work_orders.updated_at', [startDate, endDate])
            .groupBy('groups.name', 'customers.customer_type', 'work_orders.updated_at');
    }

    async getQueryClassificationByUt(customerType, buId, utId, startDate, endDate) {
        const db = this.context.database;
        const dbName = db.table(this.tableName);

        const dcs = db.raw('sum(if(type_id = 1, 1, 0)) as dcs');
        const rcs = db.raw('sum(if(type_id = 2, 1, 0)) as rcs');
        const total = db.raw('count(*) as total');

        return await dbName
            .join('groups', 'groups.id', '=', 'work_orders.group_id')
            .join('group_subs', 'group_subs.child_group_id', '=', 'groups.id')
            .join('disconnection_billings', 'disconnection_billings.id', '=', 'work_orders.relation_id')
            .join('customers', 'customers.account_no', '=', 'disconnection_billings.account_no')

            .select([
                'groups.id', 'groups.name',
                'customers.customer_type',
                dcs, rcs, total,
                'work_orders.updated_at'
            ])
            .where({
                'group_subs.parent_group_id': utId,
                'customers.customer_type': customerType,
            })
            .whereBetween('work_orders.updated_at', [startDate, endDate])
            .groupBy('groups.name', 'customers.customer_type', 'work_orders.updated_at');
    }

    async getQueryListCustomerByBu(customerType, buId, startDate, endDate) {
        const db = this.context.database;
        const dbName = db.table(this.tableName);

        return await dbName
            .join('groups', 'groups.id', '=', 'work_orders.group_id')
            .join('disconnection_billings', 'disconnection_billings.id', '=', 'work_orders.relation_id')
            .join('customers', 'customers.account_no', '=', 'disconnection_billings.account_no')

            .select([
                'disconnection_billings.account_no', 'work_orders.work_order_no',
                'customers.customer_name', 'customers.plain_address',
                'work_orders.updated_at', 'work_orders.type_id'
            ])
            .where({
                'customers.group_id': buId,
                'customers.customer_type': customerType,
            })
            .whereBetween('work_orders.updated_at', [startDate, endDate])
    }

    async getQueryListCustomerByUt(customerType, buId, utId, startDate, endDate) {
        const db = this.context.database;
        const dbName = db.table(this.tableName);

        return await dbName
            .join('groups', 'groups.id', '=', 'work_orders.group_id')
            .join('disconnection_billings', 'disconnection_billings.id', '=', 'work_orders.relation_id')
            .join('customers', 'customers.account_no', '=', 'disconnection_billings.account_no')

            .select([
                'disconnection_billings.account_no', 'work_orders.work_order_no',
                'customers.customer_name', 'customers.plain_address',
                'work_orders.updated_at', 'work_orders.type_id'
            ])
            .where({
                'customers.group_id': utId,
                'customers.customer_type': customerType,
            })
            .whereBetween('work_orders.updated_at', [startDate, endDate])
    }

    async getQueryListCustomerByGang(customerType, buId, utId, gangId, startDate, endDate) {
        const db = this.context.database;
        const dbName = db.table(this.tableName);

        return await dbName
            .join('groups', 'groups.id', '=', 'work_orders.group_id')
            .join('disconnection_billings', 'disconnection_billings.id', '=', 'work_orders.relation_id')
            .join('customers', 'customers.account_no', '=', 'disconnection_billings.account_no')

            .select([
                'disconnection_billings.account_no', 'work_orders.work_order_no',
                'customers.customer_name', 'customers.plain_address',
                'work_orders.updated_at', 'work_orders.type_id'
            ])
            .where({
                'customers.group_id': gangId,
                'customers.customer_type': customerType,
            })
            .whereBetween('work_orders.updated_at', [startDate, endDate])
    }
}


module.exports = WorkOrderMapper;