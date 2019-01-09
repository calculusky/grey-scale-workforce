const [API, ctx] = require('../index').test();
const MapperFactory = require('../core/factory/MapperFactory');
const Utils = require('../core/Utility/Utils');
const DataTables = require('../core/MDataTables');
const UserDataTable = require('../modules/Users/model/commons/UserDataTable');
const {Field} = require('datatables.net-editor-server');

it("Throw error if mapper is null", async () => {
    expect(()=>{
        const dataTable = new DataTables(ctx.database, null);
    }).toThrow("ModelMapper cannot be null");
});

it("Should return data", async () => {
    const dataTable = new UserDataTable(ctx.database, MapperFactory.build(MapperFactory.USER));
    const editor  = await dataTable.addFields(
        new Field('username')
    ).make();
    return expect(editor.data()).toEqual("");
});