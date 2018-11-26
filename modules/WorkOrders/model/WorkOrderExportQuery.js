const ExportQuery = require('../../../core/ExportQuery');
const Utils = require('../../../core/Utility/Utils');
/**
 * @author Paul Okeke
 * Created by paulex on 26/11/18.
 */
class WorkOrderExportQuery extends ExportQuery {
    constructor(query, modelMapper, api) {
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
            status: ["Status", "status"],
            priority: ["Priority", "priority"],
            created_at: ["Created At", "created_at"],
            notes:['Notes', 'notes'],
            attachments:['Attachments', 'attachments']
        };
        super(query, excelColMap, modelMapper, api);
    }

    onQuery(query) {
        const db = this.modelMapper.context.database;
        this.sqlQuery = db.table(this.modelMapper.tableName);
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
                    this.sqlQuery.where(key, value);
                    break;
                }
                case 'completed_date': {
                    this.sqlQuery.where(`${this.modelMapper.tableName}.${key}`, ">=", value)
                        .where(`${this.modelMapper.tableName}.${key}`, "<=", value);
                    break;
                }
                case 'date_from': {
                    this.sqlQuery.where(`${this.modelMapper.tableName}.created_at`, ">=", value)
                        .where(`${this.modelMapper.tableName}.created_at`, "<=", query['date_to'] || value);
                    break;
                }
                case 'type_id': {
                    this.sqlQuery.where(key, value);
                    this.sqlQuery.leftJoin('notes AS nt', 'work_orders.id', 'nt.relation_id');
                    this.sqlQuery.leftJoin('attachments AS att', 'nt.id', 'att.relation_id');
                    if (`${value}` === '1' || `${value}` === '2') {
                        this.sqlQuery.innerJoin('disconnection_billings AS db', 'work_orders.work_order_no', 'db.work_order_id');
                        this.sqlQuery.innerJoin('customers AS c', 'db.account_no', 'c.account_no');
                        this.sqlQuery.leftJoin('customers_assets AS a', 'c.account_no', 'a.customer_id');
                        this.sqlQuery.leftJoin('assets AS a2', 'a.asset_id', 'a2.id');
                        this.sqlQuery.select([
                            'work_orders.id as id',
                            'work_order_no',
                            'c.account_no',
                            'c.customer_name',
                            'c.group_id as undertaking',
                            'a2.asset_name as asset_name',
                            'db.current_bill',
                            'db.arrears',
                            'db.min_amount_payable',
                            'db.total_amount_payable',
                            'work_orders.status',
                            'work_orders.priority',
                            'work_orders.created_at',
                            db.raw(`GROUP_CONCAT(CONCAT_WS(' : ', att.file_name, att.created_at) SEPARATOR '(;)') as attachments`),
                            db.raw(`GROUP_CONCAT(CONCAT_WS(' : ', nt.note, nt.created_at) SEPARATOR '(;)') as notes`)
                        ]);
                        this.sqlQuery.groupBy('work_orders.work_order_no', 'asset_name');
                    }
                    else if (`${value}` === '3') {
                        this.sqlQuery.select([]);
                    }
                    break;
                }
            }
        }
    }

    onResultQuery(results) {
        results = results.map(row => {
            if(row['current_bill']) row['current_bill'] = (row['current_bill']).toLocaleString('en-US', {style: 'currency', currency: 'NGN'});
            if(row['arrears']) row['arrears'] = Number(row['arrears']).toLocaleString('en-US', {style: 'currency', currency: 'NGN'});
            if(row['min_amount_payable']) row['min_amount_payable'] = Number(row['min_amount_payable']).toLocaleString('en-US', {style: 'currency', currency: 'NGN'});
            if(row['total_amount_payable']) row['total_amount_payable'] = Number(row['total_amount_payable']).toLocaleString('en-US', {style: 'currency', currency: 'NGN'});
            row['status'] = Utils.getWorkStatuses(this.query.type_id, row['status']);
            row['priority'] = Utils.getWorkStatuses(this.query.type_id, row['priority']);
            row['attachments'] = row['attachments'].split("(;)").filter(i=>i!=='');
            row['notes'] = row['notes'].split("(;)").filter(i=>i!=='');
            return row;
        });
        super.onResultQuery(results);
    }
}

module.exports = WorkOrderExportQuery;