/**
 * @type {API}
 */
const [API, ctx] = require('../index').test();
const ExportQuery = require('../core/ExportQuery');
const MapperFactory = require('../core/factory/MapperFactory');

it("Throw Error if onQuery method is not inherited", () => {
    // const newExport = new ExportQuery();
    return expect(() => {
        new ExportQuery();
    }).toThrowError("onQuery Method is not overridden");
});


it("Verbose Error", () => {
   const WorkOrderExport = require('../modules/WorkOrders/model/WorkOrderExportQuery');
   const workOrderMapper = MapperFactory.build(MapperFactory.WORK_ORDER, '../modules/WorkOrders/model/mappers/WorkOrderMapper', ctx);
   const exports = new WorkOrderExport({type_id:1, status:"1,2,3,4", includes:"audit"}, workOrderMapper, API);
   return exports.export().then(sheet=>{
       expect(sheet.getCell('C2').value).toEqual("TEst");
   }).catch(console.log);
});
