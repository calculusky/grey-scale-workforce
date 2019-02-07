const [API, ctx] = require('../index').test();
const MapperFactory = require('../core/factory/MapperFactory');
const DataTables = require('../core/MDataTables');
const {Field} = require('datatables.net-editor-server');

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

//Test that


it("DataTables should fail if mapper in constructor argument is null", async () => {
    expect(()=>{
        new DataTables(ctx.database, null);
    }).toThrow("ModelMapper cannot be null");
});


describe("Build Data-Tables Data", ()=>{

    beforeAll(()=>{
        tracker.on('query', query=>{
            query.response([{
                id:1,
                username:"username"
            }])
        });
        return true;
    });

    it("DataTables.make should return data-tables data format", async ()=>{
        let dataTables = new DataTables(ctx.db(), MapperFactory.build(MapperFactory.USER));
        dataTables.addBody({}).setSession(session);
        const editor = await dataTables.make();
        return expect(editor.data()).toMatchObject({
            data: expect.any(Array)
        });
    });

    it("DataTables.make fail when permission is enabled and session is null", ()=>{
        const dataTables = new DataTables(ctx.db(), MapperFactory.build(MapperFactory.USER));
        return expect(dataTables.make()).rejects.toThrow("session is required when permissions is enabled.");
    });


    it("DataTables can add fields", ()=>{
        const dataTables = new DataTables(ctx.db(), MapperFactory.build(MapperFactory.USER));
        dataTables.addFields(new Field("first_name")).setSession(session);
        return expect(dataTables.make()).resolves.toBeDefined();
    });

});