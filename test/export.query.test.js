/**
 * @type {API}
 */
const [API, ctx] = require('../index').test();
const ExportQuery = require('../core/ExportQuery');
const MapperFactory = require('../core/factory/MapperFactory');
const globalMock = require('./setup/ApplicationDependency');

/**
 * @param session {Session}
 */
let knexMock, tracker, session;

beforeAll(async (done) => {
    [knexMock, tracker, session] = await globalMock.applicationBeforeAll(ctx);
    done();
});

afterAll(async done => {
    await ctx.getPersistence().disconnect();
    knexMock.unmock(ctx.db(), 'knex@0.15.2');
    done();
});

it("Throw Error if onQuery method is not inherited", () => {
    return expect(new ExportQuery().export()).rejects.toThrowError("onQuery must be implemented.");
});

describe("Data Export", () => {

    it("Test that we can export file in excel", () => {
        const WorkOrderExport = require('../modules/WorkOrders/model/WorkOrderExportQuery');
        const workOrderMapper = MapperFactory.build(MapperFactory.WORK_ORDER, '../modules/WorkOrders/model/mappers/WorkOrderMapper', ctx);
        const query = {type_id: 1, status: "1,2,3,4", includes: "audit"};
        const exports = new WorkOrderExport(query, workOrderMapper, session, API);
        return expect(exports.export()).resolves.toMatchObject({
            _definedNames: {matrixMap: expect.any(Object)},
            subject: "mrworking-file-export.xlsx"
        });
    });

    it("Export AuditLog and TableRecords should pass successfully", async () => {
        const WorkOrderExport = require('../modules/WorkOrders/model/WorkOrderExportQuery');
        const workOrderMapper = MapperFactory.build(MapperFactory.WORK_ORDER, '../modules/WorkOrders/model/mappers/WorkOrderMapper', ctx);
        const exports = new WorkOrderExport({type_id: 3, includes: "audit,records"}, workOrderMapper, session, API);
        const groups = await ctx.getKey('groups', true);
        exports.setGroups(groups);
        return expect(exports.export()).resolves.toBeDefined();
    });

});


describe("Work Orders Export", ()=>{
    it("Export Work Orders successfully", async () => {
        const WorkBook = require('exceljs').Workbook;
        const query = { type_id: '3', with: 'records', status: '', group_id: '', created_by: '', work_order_no: '', completed_date: '2019/04/25 07:34',completed_date_to:"2019/04/25 07:35", date_from: '', date_to: '' };
        return expect(API.workOrders().exportWorkOrders(query, session, API)).resolves.toBeInstanceOf(WorkBook);
    });
});

