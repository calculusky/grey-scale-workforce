/**
 * @type {API}
 */
const [API, ctx] = require('../index').test();
const ExportQuery = require('../core/ExportQuery');
const MapperFactory = require('../core/factory/MapperFactory');

it("Throw Error if onQuery method is not inherited", () => {
    return expect(() => {
        new ExportQuery();
    }).toThrowError("onQuery Method is not overridden");
});


// it("Test that we can export file in excel", () => {
//     const WorkOrderExport = require('../modules/WorkOrders/model/WorkOrderExportQuery');
//     const workOrderMapper = MapperFactory.build(MapperFactory.WORK_ORDER, '../modules/WorkOrders/model/mappers/WorkOrderMapper', ctx);
//     const who = {
//         sub: 1, group: [1], permissions: {
//             "works.access": true,
//             "works.index": "group",
//             "works.create": false,
//             "works.show": "all",
//             "works.edit": "all",
//         }
//     };
//     const exports = new WorkOrderExport({type_id: 1, status: "1,2,3,4", includes: "audit"}, workOrderMapper, who, API);
//     return expect(exports.export()).resolves.toBeDefined();
// });

it("Test that we can export file in excel", () => {
    const WorkOrderExport = require('../modules/WorkOrders/model/WorkOrderExportQuery');
    const workOrderMapper = MapperFactory.build(MapperFactory.WORK_ORDER, '../modules/WorkOrders/model/mappers/WorkOrderMapper', ctx);
    const who = {
        sub: 1, group: [1], permissions: {
            "works.access": true,
            "works.index": "all",
            "works.create": false,
            "works.show": "all",
            "works.edit": "all",
        }
    };
    const exports = new WorkOrderExport({type_id: 1, includes: "audit,records"}, workOrderMapper, who, API);

    return expect(exports.export()).resolves.toBeDefined();
});
