const ExportQuery = require('../../../core/ExportQuery');
const Utils = require('../../../core/Utility/Utils');
const ApiService = require('../../ApiService');

class FaultExportQuery extends ExportQuery {

    constructor(query, modelMapper, who, api) {
        const excelColMap = {
            id: ["Fault No", "id"],
            asset_name: ["Asset Name", "asset_name"],
            category: ["Category", "fault_category_id"],
            summary: ["Summary", "summary"],
            priority: ["Priority", "priority"],
            status: ["Status", "status"],
            undertaking: ["Undertaking", "undertaking"],
            assigned_to: ["Assigned To", "assigned_to"],
            created_at: ["Date Created", "created_at"],
            completed_date: ["Date Completed", "completed_date"],
            source: ["Source", "source"],
            source_name: ["Source Name", "source_name"],
            owner: ["Created By", "created_by"],
        };
        super(query, excelColMap, modelMapper, who, api);
        this.groups = {};
    }

    setGroups(groups) {
        this.groups = groups;
        return this;
    }

    onQuery(query) {
        const db = this.modelMapper.context.db();
        const tableName = this.modelMapper.tableName;
        this.sqlQuery = db.table(tableName);
        const selectCols = [], groupBy = [];

        const addAssets = () => {
            this.sqlQuery.innerJoin('assets AS a2', `${tableName}.relation_id`, 'a2.id');
            selectCols.push('a2.asset_name as asset_name', "a2.group_id as undertaking");
            groupBy.push('asset_name')
        };

        for (const [key, value] of Object.entries(query)) {
            switch (key) {
                case "priority": {
                    this.sqlQuery.whereIn(`${tableName}.${key}`, value.split(','));
                    break;
                }
                case 'status': {
                    this.sqlQuery.whereIn(`${tableName}.${key}`, `${value}`.split(','));
                    break;
                }
                case 'category_id': {
                    this.sqlQuery.whereIn(`${tableName}.fault_category_id`, value.split(','));
                    break;
                }
                case 'created_by': {
                    this.sqlQuery.where(`${tableName}.${key}`, value);
                    break;
                }
                case 'completed_date': {
                    const dateFrom = Utils.date.dateFormat(value, undefined, 'YYYY-MM-DD');
                    this.sqlQuery.where(`${tableName}.${key}`, ">=", `${dateFrom} 00:00:00`)
                        .where(`${tableName}.${key}`, "<=", `${dateFrom} 23:59:00`);
                    break;
                }
                case 'date_from': {
                    const dateFrom = Utils.date.dateFormat(value, undefined, 'YYYY-MM-DD');
                    const dateTo = Utils.date.dateFormat(query['date_to'] || value, undefined, 'YYYY-MM-DD');
                    this.sqlQuery.where(`${tableName}.created_at`, ">=", `${dateFrom} 00:00:00`)
                        .where(`${tableName}.created_at`, "<=", `${dateTo} 23:59:00`);
                    break;
                }
                case 'group_id': {
                    const _groups = value.split(',');
                    const groupIds = _groups.concat(..._groups.map(id => Utils.getGroupChildren(this.groups[id]).ids));
                    this.sqlQuery.whereIn('a2.group_id', groupIds);
                    break;
                }
                case 'related_to': {
                    return this.sqlQuery.where(`${tableName}.${key}`, value);
                }
                case 'relation_id': {
                    this.sqlQuery.where(`${tableName}.${key}`, value);
                    break;
                }
            }
        }
        //By default we add assets name
        addAssets();
        this.sqlQuery.leftJoin('users AS ua', db.raw(`JSON_CONTAINS(${tableName}.assigned_to->'$[*].id', CAST(ua.id as JSON))`));
        this.sqlQuery.leftJoin("fault_categories AS fc", `${tableName}.fault_category_id`, 'fc.id');
        this.sqlQuery.leftJoin("users AS u", `${tableName}.created_by`, 'u.id');

        selectCols.push(
            `${tableName}.id as id`,
            `${tableName}.summary as summary`,
            `${tableName}.priority as priority`,
            `${tableName}.status as status`,
            'fc.name as category',
            `${tableName}.completed_date as completed_date`,
            `${tableName}.created_at`,
            `${tableName}.source`,
            db.raw(`${tableName}.metadata->'$.crm_fullname' as source_name`),
            db.raw("CONCAT(u.first_name, ' ', u.last_name) as owner"),
            db.raw(`CAST(CONCAT('[', GROUP_CONCAT(DISTINCT CONCAT('"', ua.first_name, ' ', ua.last_name, '"')), ']')as JSON) as assigned_to`)
        );

        groupBy.push(`${tableName}.id`);
        this.sqlQuery.groupBy(...groupBy);
        this.sqlQuery.orderBy(`${tableName}.created_at`, 'asc');
        this.sqlQuery.select(selectCols);
        ApiService.queryWithPermissions('faults.index', this.sqlQuery, this.modelMapper, this.who);
    }

    onResultQuery(results) {
        const fResults = results.map(row => {
            const undertaking = Utils.getGroupParent(this.groups[row['undertaking']], 'undertaking');
            const assignedTo = row['assigned_to'] || [];
            row['id'] = `#${row['id']}`;
            row['source'] = (row['source'] == null) ? "IE-Force" : row['source'].toUpperCase();
            row['status'] = Utils.getFaultStatus(row['status']);
            row['priority'] = Utils.getFaultPriority(row['priority']);
            row['assigned_to'] = assignedTo.map((t) => `${t}`).join('\r\n');
            row['undertaking'] = (undertaking) ? undertaking.name : null;
            return row;
        });
        super.onResultQuery(fResults);
    }

}

module.exports = FaultExportQuery;