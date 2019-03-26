/**
 * @type {API}
 */
const [API, ctx] = require('../index').test();
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

describe("Creating and Updating Base Records", () => {

    beforeAll(() => {
        tracker.on('query', query => {
            if (query.method === 'insert') {
                return query.response([1, {
                    fieldCount: 0,
                    affectedRows: 1,
                }]);
            }
        });
    });

    it("CreatePendingReason should fail when mandatory fields are missing", () => {
        return expect(API.baseRecords().createPendingReason({}, session)).rejects.toMatchObject({
            code: 400,
            err: {
                code: "VALIDATION_ERROR",
                data: {
                    'name': ['The name is required.']
                }
            }
        });
    });

    it("CreateFaultCategory should fail when mandatory fields are missing", () => {
        return expect(API.baseRecords().createFaultCategory({}, session)).rejects.toMatchObject({
            code: 400,
            err: {
                code: "VALIDATION_ERROR",
                data: {
                    'name': ['The name is required.'],
                    'type': ['The type is required.'],
                }
            }
        });
    });

    it("UpdatePendingReason should update successfully", () => {
        const updateBody = {name: "PendingReason!!!"};
        return expect(API.baseRecords().updatePendingReason('id', 1, updateBody, session, API)).resolves.toMatchObject({
            code: 200,
            data: {
                data: updateBody
            }
        });
    });

    it("UpdateFaultCategory should update successfully", () => {
        const updateBody = {name: "FaultCategory!!!"};
        return expect(API.baseRecords().updateFaultCategory('id', 1, updateBody, session, API)).resolves.toMatchObject({
            code: 200,
            data: {
                data: updateBody
            }
        });
    });

    it("CreateStatus should fail when mandatory fields are missing", () => {
        return expect(API.baseRecords().createStatus({}, session)).rejects.toMatchObject({
            code: 400,
            err: {
                code: "VALIDATION_ERROR",
                data: {
                    'name': ['The name is required.'],
                    'type': ['The type is required.'],
                }
            }
        });
    });

    it("CreateStatus should create successfully", () => {
        const data = {
            name: "test",
            type: "DW"
        };
        return expect(API.baseRecords().createStatus(data, session)).resolves.toMatchObject({
            code: 200,
            data: {data: data}
        });
    });

});

describe("Retrieve Base Records", () => {

    it("GetFaultCategories should return a list of categories", () => {
        return expect(API.baseRecords().getFaultCategories({type: "default"}, session)).resolves.toMatchObject({
            code: 200,
            data: {
                data: {
                    items: [{
                        id: 1,
                        name: "ApplicationDependency",
                        type: "default"
                    }]
                }
            }
        });
    });

    it("GetStatuses should return a list of status", () => {
        return expect(API.baseRecords().getStatuses({}, session)).resolves.toMatchObject({
            code: 200,
            data: {
                data: {
                    "DW": [{
                        id: 1,
                        name: "New",
                        comments: []
                    }, expect.any(Object), expect.any(Object)]
                }
            }
        });
    });

});
