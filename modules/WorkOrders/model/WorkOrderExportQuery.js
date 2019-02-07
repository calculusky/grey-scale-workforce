const ExportQuery = require('../../../core/ExportQuery');
const Utils = require('../../../core/Utility/Utils');
const ApiService = require('../../ApiService');

/**
 * @author Paul Okeke
 * Created by paulex on 26/11/18.
 */
class WorkOrderExportQuery extends ExportQuery {

    constructor(query, modelMapper, who, api) {
        const excelColMap = {
            work_order_no: ["Work Order No", "work_order_no"],
            account_no: ["Account No", "account_no"],
            customer_name: ["Account Name", "customer_name"],
            undertaking: ["Undertaking", "undertaking"],
            asset_name: ["Asset Name", "asset_name"],
            current_bill: ["Current Bill", "current_bill"],
            arrears: ["Arrears", "arrears"],
            min_amount_payable: ["Amount Due", "min_amount_payable"],
            total_amount_payable: ["Total Amount Due", "total_amount_payable"],
            assigned_to: ['Assigned To', 'assigned_to'],
            status: ["Status", "status"],
            priority: ["Priority", "priority"],
            start_date: ["Scheduled Start", "start_date"],
            completed_date: ["Completed Date", "completed_date"],
            created_at: ["Created At", "created_at"],
            owner: ["Created By", "created_by"],
            notes: ['Notes', 'notes'],
            attachments: ['Attachments', 'attachments']
        };

        const faultColMap = {
            work_order_no: ["Work Order No", "work_order_no"],
            fault_no: ["Fault No", "fault_no"],
            fault_operation: ["Fault Operation", "fault_operation"],
            asset_name: ["Asset Name", "asset_name"],
            undertaking: ["Undertaking", "undertaking"],
            status: ["Status", "status"],
            priority: ["Priority", "priority"],
            start_date: ["Scheduled Start", "start_date"],
            completed_date: ["Completed Date", "completed_date"],
            assigned_to: ['Assigned To', 'assigned_to'],
            created_at: ["Created At", "created_at"],
            owner: ["Created By", "created_by"],
            notes: ['Notes', 'notes'],
            attachments: ['Attachments', 'attachments']
        };
        super(query, (`${query.type_id}` === '3') ? faultColMap : excelColMap, modelMapper, who, api);

        this.groups = {};
    }

    setGroups(groups) {
        this.groups = groups;
        return this;
    }

    /**
     *
     * @param query {Object}
     * @param query.type_id {String|Number} 1 represents disconnection billings
     *                                      2 represents re-connection billings
     *                                      3 represents faults
     */
    onQuery(query) {
        const db = this.modelMapper.context.database;
        this.sqlQuery = db.table(this.modelMapper.tableName);
        const selectCols = [];
        for (const [key, value] of Object.entries(query)) {
            switch (key) {
                case 'priority': {
                    this.sqlQuery.whereIn(`${this.modelMapper.tableName}.${key}`, value.split(','));
                    break;
                }
                case 'status': {
                    this.sqlQuery.whereIn(`${this.modelMapper.tableName}.${key}`, value.split(','));
                    break;
                }
                case 'created_by': {
                    this.sqlQuery.where(`${this.modelMapper.tableName}.${key}`, value);
                    break;
                }
                case 'completed_date': {
                    const dateFrom = Utils.date.dateFormat(value, undefined, 'YYYY-MM-DD');
                    this.sqlQuery.where(`${this.modelMapper.tableName}.${key}`, ">=", `${dateFrom} 00:00:00`)
                        .where(`${this.modelMapper.tableName}.${key}`, "<=", `${dateFrom} 23:59:00`);
                    break;
                }
                case 'date_from': {
                    const dateFrom = Utils.date.dateFormat(value, undefined, 'YYYY-MM-DD');
                    const dateTo = Utils.date.dateFormat(query['date_to'] || value, undefined, 'YYYY-MM-DD');
                    this.sqlQuery.where(`${this.modelMapper.tableName}.created_at`, ">=", `${dateFrom} 00:00:00`)
                        .where(`${this.modelMapper.tableName}.created_at`, "<=", `${dateTo} 23:59:00`);
                    break;
                }
                case 'account_no': {
                    if (['1', '2'].includes(`${query['type_id']}`))
                        this.sqlQuery.where('c.account_no', value);
                    break;
                }
                case 'group_id': {
                    const _groups = value.split(',');
                    const groupIds = _groups.concat(..._groups.map(id => Utils.getGroupChildren(this.groups[id]).ids));
                    (['1', '2'].includes(`${query['type_id']}`))
                        ? this.sqlQuery.whereIn('db.group_id', groupIds)
                        : this.sqlQuery.whereIn('a2.group_id', groupIds);
                    break;
                }
                case 'work_order_no': {
                    const workOrderNo = value.replace(/-/g, "");
                    this.sqlQuery.where(`${this.modelMapper.tableName}.${key}`, workOrderNo);
                    break;
                }
                case 'type_id': {
                    //@Query for Disconnection and Reconnection work orders
                    if (`${value}` === '1' || `${value}` === '2') {
                        this.sqlQuery.innerJoin('disconnection_billings AS db', 'work_orders.work_order_no', 'db.work_order_id');
                        this.sqlQuery.innerJoin('customers AS c', 'db.account_no', 'c.account_no');
                        this.sqlQuery.leftJoin('customers_assets AS ca', 'c.account_no', 'ca.customer_id');
                        this.sqlQuery.leftJoin('assets AS a2', 'ca.asset_id', 'a2.id');
                        selectCols.push(
                            'c.account_no', 'c.customer_name', 'c.group_id as undertaking',
                            'a2.asset_name as asset_name', 'db.current_bill', 'db.arrears', 'db.min_amount_payable',
                            'db.total_amount_payable'
                        );
                        this.sqlQuery.groupBy(
                            'work_orders.work_order_no', 'a2.asset_name', 'c.account_no',
                            'db.current_bill', 'db.arrears', 'db.min_amount_payable', 'db.total_amount_payable'
                        );
                    }
                    //@Query for Fault Orders
                    else if (`${value}` === '3') {
                        this.sqlQuery.innerJoin('faults AS ft', 'work_orders.relation_id', 'ft.id');
                        this.sqlQuery.innerJoin('assets AS a2', 'ft.relation_id', 'a2.id');
                        this.sqlQuery.leftJoin('fault_categories AS fc', 'fc.id', 'ft.fault_category_id');
                        selectCols.push('ft.id as fault_no', 'a2.asset_name as asset_name',
                            'a2.group_id as undertaking', 'fc.name as fault_operation');
                        this.sqlQuery.groupBy('work_orders.work_order_no', 'asset_name');
                    }
                    /*--------------------------------------------------
                    * @Query default query for all type of work orders |
                    *--------------------------------------------------*/
                    this.sqlQuery.where(key, value);
                    this.sqlQuery.leftJoin('notes AS nt', 'work_orders.id', 'nt.relation_id');
                    this.sqlQuery.leftJoin('attachments AS att', 'nt.id', 'att.relation_id');
                    this.sqlQuery.leftJoin('users AS ua', db.raw(`JSON_CONTAINS(work_orders.assigned_to->'$[*].id', CAST(ua.id as JSON))`));
                    this.sqlQuery.leftJoin("users AS nu", 'nt.created_by', 'nu.id');
                    this.sqlQuery.leftJoin("users AS u", 'work_orders.created_by', 'u.id');
                    selectCols.push(
                        'work_orders.id as id', 'work_order_no', 'work_orders.start_date',
                        'work_orders.completed_date', 'work_orders.status', 'work_orders.priority', 'work_orders.created_at',
                        db.raw("CONCAT(u.first_name, ' ', u.last_name) as owner"),
                        db.raw("work_orders.assigned_to->'$[*].created_at' as times_assigned"),
                        db.raw(`CAST(CONCAT('[', GROUP_CONCAT(DISTINCT CONCAT('"', ua.first_name, ' ', ua.last_name, '"')), ']')as JSON) as assigned_to`),
                        db.raw(`CAST(CONCAT('[', GROUP_CONCAT(DISTINCT CONCAT('"', att.file_name, '"')), ']') as JSON) as attachments`),
                        db.raw(`GROUP_CONCAT(DISTINCT CONCAT(nu.first_name, ' - ', nt.note, ' : ', nt.created_at) SEPARATOR '<@>') as notes`)
                    );
                    break;
                }
            }
        }
        //@HelpTips - Log the Query to see the actual sql query. console.log(this.sqlQuery.toString());
        this.sqlQuery.orderBy(`${this.modelMapper.tableName}.created_at`, 'asc');
        this.sqlQuery.select(selectCols);
        ApiService.queryWithPermissions('works.index', this.sqlQuery, this.modelMapper, this.who);
    }

    /**
     * The result of the sql query is manipulated here
     * @param results
     */
    onResultQuery(results) {
        results = results.map(row => {
            const undertaking = Utils.getGroupParent(this.groups[row['undertaking']], 'undertaking');
            if (`${this.query.type_id}` === '1' || `${this.query.type_id}` === '2') {
                const cFormat = {style: 'currency', currency: 'NGN'};
                row['current_bill'] = Number(row['current_bill']).toLocaleString('en-NG', cFormat);
                row['arrears'] = Number(row['arrears']).toLocaleString('en-NG', cFormat);
                row['min_amount_payable'] = Number(row['min_amount_payable']).toLocaleString('en-NG', cFormat);
                row['total_amount_payable'] = Number(row['total_amount_payable']).toLocaleString('en-NG', cFormat)
            }
            const attachments = row['attachments'] || [],
                notes = (row['notes'] || "").split("<@>"),
                assignedTo = row['assigned_to'] || [];
            row['status'] = Utils.getWorkStatuses(this.query.type_id, row['status']);
            row['priority'] = Utils.getWorkStatuses(this.query.type_id, row['priority']);
            const url = `${process.env.APP_URL}:${process.env.PORT}`;
            row['attachments'] = attachments.filter(i => i !== null).map(file => `${url}/attachment/notes/download/${file}`).join('\r\n');
            row['notes'] = notes.filter(i => i !== null).join('\r\n');
            row['assigned_to'] = assignedTo.map((t, i) => `${t} : ${row['times_assigned'][i]}`).join('\r\n');
            row['undertaking'] = (undertaking) ? undertaking.name : null;
            return row;
        });
        super.onResultQuery(results);
    }

    getAuditRecordId(textRow) {
        return textRow['work_order_no'];
    }
}

module.exports = WorkOrderExportQuery;