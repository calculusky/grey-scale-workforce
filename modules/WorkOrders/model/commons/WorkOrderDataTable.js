const MDataTables = require('../../../../core/MDataTables');
const {Field} = require('datatables.net-editor-server');
const Utils = require('../../../../core/Utility/Utils');

class WorkOrderDataTable extends MDataTables {

    /**
     *
     * @param db
     * @param mapper {WorkOrderMapper}
     * @param who {Session}
     */
    constructor(db, mapper, who) {
        super(db, mapper);
        this.setSession(who);

        //After rows have been fetched, get the assigned to records from the users table
        this.editor.on("postGet", async (editor, id, data) => {
            for (const row of data) row.assigned = await Utils.getAssignees(row.assigned, this.editor.db());
        });
    }

    /**
     *
     * @param fields
     * @returns {MDataTables}
     */
    addFields(...fields) {
        const type = Utils.identifyWorkOrderDataTableType(this.body.columns);
        fields.push(
            new Field('work_orders.id', 'checkbox'),
            new Field('work_orders.work_order_no', 'work_order_no').getFormatter(Utils.humanizeUniqueSystemNumber),
            new Field('work_orders.type_id'),
            new Field('work_orders.status', 'status').getFormatter((val, row) => Utils.getWorkStatuses(row['work_orders.type_id'], val)),
            new Field("work_orders.assigned_to", 'assigned'),
            new Field('work_orders.created_at', 'created_at')
        );
        if (type === 3) this.onFaultOrder(fields);
        else if (type === 1) this.onDisconnectionOrder(fields);
        return super.addFields(...fields);
    }

    /**
     *
     * @param fields
     * @private
     */
    onDisconnectionOrder(fields = []) {
        fields.push(
            new Field('customers.customer_name', 'account_name'),
            new Field("customers.account_no", 'account_no'),
            new Field('groups.name', 'undertaking'),
            new Field('assets.asset_name', 'asset_name'),
            new Field('disconnection_billings.total_amount_payable', 'total_amount'),
        );
        this.editor
            .leftJoin('disconnection_billings', 'disconnection_billings.id', '=', 'work_orders.relation_id')
            .leftJoin('customers', 'customers.account_no', '=', 'disconnection_billings.account_no')
            .leftJoin('customers_assets', 'customers_assets.customer_id', '=', 'customers.account_no')
            .leftJoin('assets', 'assets.id', '=', 'customers_assets.asset_id')
            .leftJoin('groups', 'groups.id', '=', 'customers.group_id')
            .where('work_orders.related_to', '=', 'disconnection_billings');
    }

    /**
     *
     * @param fields
     * @private
     */
    onFaultOrder(fields = []) {
        fields.push(
            new Field("faults.id", 'fault_no'),
            new Field('assets.asset_name', 'fault_relation'),
            new Field('groups.name', 'undertaking')
        );
        this.editor
            .leftJoin('faults', 'faults.id', '=', 'work_orders.relation_id')
            .leftJoin('assets', 'assets.id', '=', 'faults.relation_id')
            .leftJoin('groups', 'groups.id', '=', 'assets.group_id')
            .where('work_orders.related_to', 'faults')
    }

}

module.exports = WorkOrderDataTable;
