/**
 * @type {API}
 */
const [API, ctx] = require('../index').test();
const globalMock = require('./setup/ApplicationDependency');
let Utils = require('../core/Utility/Utils');

let knexMock, tracker, session;

beforeAll(async (done) => {
    [knexMock, tracker, session] = await globalMock.applicationBeforeAll(ctx);
    tracker.uninstall();
    done();
});

afterAll(async done => {
    await ctx.getPersistence().disconnect();
    knexMock.unmock(ctx.db(), 'knex@0.15.2');
    done();
});


describe("Retrieve Notes", () => {
    beforeAll(() => {
        tracker.install();
        tracker.on('query', query => {
            if (query.sql.indexOf('from `notes`') !== -1) {
                return query.response([{
                    id: 1,
                    relation_id: 1,
                    module: "work_orders",
                    note: "Hello Everyone",
                    created_by:1
                }])
            }
            return query.response([]);
        });
    });
    afterAll(() => tracker.uninstall());

    it("GetNotes should return a list of notes", () => {
        return expect(API.notes().getNotes("1", "work_orders", session)).resolves.toMatchObject({
            code: 200,
            data: {
                data: {
                    items: [{
                        id: 1,
                        relation_id: 1,
                        module: "work_orders",
                        note: "Hello Everyone"
                    }]
                }
            }
        })
    });
});

describe("Create Notes", ()=>{
    beforeAll(() => {
        tracker.install();
        tracker.on('query', query => {
            if (query.method==='insert') {
                return query.response([1,{}])
            }
            return query.response([]);
        });
        // Utils.convertLocationToPoints = jest.fn(()=> {
        //     return Promise.resolve({point: ctx.db().raw(`POINT(${2.3}, ${3.4})`), location:{x:10, y:10, address:"test"}});
        // })
    });
    afterAll(() => tracker.uninstall());
    it("CreateNote should fail if mandatory fields are missing", ()=>{
        return expect(API.notes().createNote({}, session)).rejects.toMatchObject({
           code:400,
           err:{
               data:{
                   relation_id:["The relation id is required."],
                   module:["The module is required."],
                   note:["The note is required."],
               }
           }
        });
    });


    it("CreateNote should create a note successfully", ()=>{
        const note = {
            relation_id:"1",
            module:"work_orders",
            note:"Testlim Balogun"
        };
        return expect(API.notes().createNote(note, session)).resolves.toMatchObject({
            code:200,
            data:{
                data:{
                    relation_id:"1",
                    module:"work_orders",
                    note:"Testlim Balogun"
                }
            }
        });
    });

    it("CreateNote with location data and files should be successful", ()=>{
        const note = {
            relation_id:"1",
            module:"work_orders",
            note:"Testlim Balogun"
            // location:'{"x":44.3323, "y":4.64232}'
        };

        return expect(API.notes().createNote(note, session, API, [])).resolves.toMatchObject({
            code:200,
            data:{
                data:{
                    relation_id:"1",
                    module:"work_orders",
                    note:"Testlim Balogun"
                }
            }
        });
    });


});