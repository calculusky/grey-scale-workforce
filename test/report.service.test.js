/**
 * Created by paulex on 9/6/17.
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

describe("Retrieve Reports", ()=>{
    it("GetBasicDashboard should return reports successfully", ()=>{
        return expect(API.reports().getBasicDashboard(session)).resolves.toMatchObject({
            code:200,
            data:{
                data:{
                    items:expect.any(Array)
                }
            }
        });
    })
});