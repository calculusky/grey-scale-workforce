const [API, ctx] = require('../index').test();
const globalMock = require('./setup/ApplicationDependency');
const Utils = require('../core/Utility/Utils');

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


describe("Fault Creation and Update", () => {

    beforeAll(() => {
        Utils.requestPromise = jest.fn(() => (Promise.resolve()));

        tracker.on('query', query => {
            if (query.method === 'insert') {
                return query.response([1, {
                    fieldCount: 0,
                    affectedRows: 1,
                }]);
            }
            return query.response([{
                id: 1,
                category_id: 1,
                group_id: 1,
                related_to: "assets",
                relation_id: "1"
            }]);
        });
    });

    it("Test that createFault is defined", () => {
        return expect(API.faults().createFault()).rejects.toBeDefined()
    });

    it("CreateFault should fail when mandatory fields are missing", () => {
        return expect(API.faults().createFault()).rejects.toMatchObject({
            code: 400,
            err: {
                data: {
                    category_id: ["The category id is required."],
                    group_id: ["The group id is required."],
                    priority: ["The priority is required."],
                }
            }
        })
    });


    it("CreateFault should pass when mandatory fields are specified", () => {
        const fault = {
            category_id: 1,
            related_to: "assets",
            relation_id: "64",
            status: 1,
            summary: "test",
            group_id: 1,
            priority: 1,
            labels: []
        };
        return expect(API.faults().createFault(fault, session, [], API)).resolves.toMatchObject({
            code: 200,
            data: {
                data: fault
            }
        })
    });


    it("UpdateFault should pass with expected values", () => {
        const fault = {
            category_id: 1,
            related_to: "assets",
            relation_id: "1",
            status: 3,
            summary: "Creeping",
            group_id: 1,
            priority: 3,
            assigned_to: '["2", "3"]'
        };

        return expect(API.faults().updateFault("id", 1, fault, session, [], API)).resolves.toMatchObject({
            code: 200,
            data: {
                data: Object.assign(fault, {assigned_to: expect.any(Array)})
            }
        });
    });
});

describe("Retrieve Faults", () => {

    beforeAll(() => {
        tracker.on('query', query => {
            if (query.sql.indexOf('from `faults`') !== -1) {
                return query.response([{
                    id: 1,
                    related_to: "assets",
                    relation_id: "1",
                    group_id: 1
                }]);
            }
            else if (query.sql.indexOf('select count') !== -1) {
                return query.response([{
                    works_count: 0,
                    notes_count: 2,
                    attachments_count: 3
                }])
            }
            return query.response([]);
        });
    });

    it("GetFaults should pass with returned fault items", () => {
        return expect(API.faults().getFaults({assigned_to: 1},session)).resolves.toMatchObject({
            code: 200,
            data: {
                data: {
                    items: [{
                        id: 1,
                        related_to: "assets",
                        relation_id: "1",
                        assigned_to: [],
                        notes_count: 2,
                        attachments_count: 3,
                        wo_count: 0,
                        group: {
                            id: 1,
                            name: "Abule-Egba-BU",
                            short_name: "ABL",
                            type: "business_unit"
                        }
                    }]
                }
            }
        });
    });
});

describe("Fault Deletion", ()=>{

    it("DeleteFault should successfully delete the specified fault", ()=>{
        return expect(API.faults().deleteFault('id', 1, session, API)).resolves.toMatchObject({
            code:200,
            data:{
                data:{
                    message:"Fault successfully deleted."
                }
            }
        });
    });

});


describe("Faults DataTable", ()=>{
    beforeAll(()=>{
       tracker.on('query', query=>{
          return query.response([]);
       });
    });
    it("GetFaultTableRecords should fetch fault records in dataTable format", ()=>{
        return expect(API.faults().getFaultTableRecords({}, session)).resolves.toMatchObject({
            data:expect.any(Array)
        });
    });
});