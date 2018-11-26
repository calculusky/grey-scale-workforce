const Excel = require('exceljs');

/**
 * @author Paul Okeke
 * Created by paulex on 26/11/18.
 */
class ExportQuery {

    /**
     *
     * @param query
     * @param colMap
     * @param modelMapper {ModelMapper}
     * @param api {API}
     */
    constructor(query = {}, colMap = {}, modelMapper, api) {
        //clear out empty keys
        Object.keys(query).forEach(key => {
            if (query[key] === undefined || query[key] === null || `${query[key]}`.trim() === '') delete query[key];
        });
        this.query = query;
        this.colMap = colMap;
        this.modelMapper = modelMapper;
        this.includeAudit = query.hasOwnProperty("includes") && (query.includes.indexOf("audit") !== -1);
        this.queryResult = [];
        this.api = api;
        this.sqlQuery = null;
        this.onQuery(query);
    }

    onQuery(query) {
        throw new Error("onQuery Method is not overridden");
    }

    /**
     *
     * @returns {null}
     */
    getQuery() {
        return this.sqlQuery;
    }

    /**
     *
     * @returns {Promise<void>}
     * @private
     */
    async executeQuery() {
        this.queryResult = await this.getQuery();
        this.onResultQuery(this.queryResult);
    }

    /**
     *
     * @param result
     */
    onResultQuery(result) {
        this.queryResult = result;
    }

    /**
     *
     * @returns {Promise<void>}
     */
    async getAudits(relationId) {
        const rQuery = {module: this.modelMapper.tableName, relation_id: relationId};
        console.log(rQuery);
        const {data: {data: {items}}} = await this.api.activities().getActivities(rQuery, {}, this.api).catch(console.error);
        console.log(items);
        return items;
    }


    async export() {
        await this.executeQuery();
        const workBook = new Excel.Workbook();
        const mainSheet = workBook.addWorksheet(this.modelMapper.tableName);
        const auditLogSheet = workBook.addWorksheet("AuditLog");
        mainSheet.state = 'visible';
        auditLogSheet.state = 'visible';
        workBook.creator = 'Vascon Solutions';
        const headerStyle = {font: {name: 'Carlito', family: 4, size: 12, bold: true}};
        const bodyStyle = {font: {name: 'Carlito', family: 4, size: 12, bold: false}};
        const mainColumns = Object.keys(this.colMap).map(key => {
            return {header: this.colMap[key][0], key: this.colMap[key][1], width: 12, style: headerStyle};
        });
        if (this.includeAudit) auditLogSheet.columns = ExportQuery._getAuditColumns();

        mainSheet.columns = mainColumns;

        for (const textRow of this.queryResult) {
            const row = {};
            for (const [key, value] of Object.entries(textRow)) {
                if (this.colMap[key] && Array.isArray(this.colMap[key])) {
                    if (Array.isArray(value)) {
                        row[this.colMap[key][1]] = value.map(txt => `${txt}`).join('\r\n');
                        row['alignment'] = {wrapText: true};
                    } else row[this.colMap[key][1]] = value;
                }
            }
            mainSheet.addRow(row).font = bodyStyle.font;

            if (this.includeAudit) {
                const logs = await this.getAudits(textRow[this.modelMapper.primaryKey]).catch(err => console.log(err));
                if (!logs.length) continue;
                const lastRowNumber = auditLogSheet.lastRow.number;
                for (const log of logs) {
                    log.record_id = textRow['work_order_no'];
                    const aRow = auditLogSheet.addRow(log);
                    aRow.font = bodyStyle.font;
                    aRow.alignment = {vertical: 'middle', horizontal: 'center'}
                }
                auditLogSheet.mergeCells(`A${lastRowNumber + 1}:A${lastRowNumber + logs.length}`);
            }
        }
        workBook.xlsx.writeFile('newFile.xlsx').then(function () {
            console.log('done')
        });
        return mainSheet;
    }

    /**
     *
     * @returns {*[]}
     * @private
     */
    static _getAuditColumns() {
        const headerStyle = {
            font: {name: 'Carlito', family: 4, size: 12, bold: true},
            alignment: {vertical: 'middle', horizontal: 'center'}
        };
        return [
            {header: "Record Name", key: "record_id", width: 15, style: headerStyle},
            {header: "Event Type", key: "event_type", width: 15, style: headerStyle},
            {header: "Field Name", key: "field_name", width: 15, style: headerStyle},
            {header: "Field Value", key: "field_value", width: 15, style: headerStyle},
            {header: "Old Value", key: "old_value", width: 15, style: headerStyle},
            {header: "Event Owner", key: "by", width: 15, style: headerStyle},
            {header: "Event Time", key: "event_time", width: 15, style: headerStyle}
        ];
    }
}


module.exports = ExportQuery;
