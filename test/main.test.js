const [API, ctx] = require('../index').test();
const globalMock = require('./setup/ApplicationDependency');
const main = require('../schedulers/main')(ctx, API);

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

it("Should have alteast one test suite", ()=>{
    return expect(1+1).toEqual(2);
});


