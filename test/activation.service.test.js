/**
 * @type API {API}
 */
const [API, ctx] = require('../index').test();
const globalMock = require('./setup/ApplicationDependency');

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

it("activateUser should be defined", () => {
    return expect(API.activations().activateUser(1)).toBeDefined();
});

describe('Test Activations with database mock', () => {
    beforeAll(() => {
        tracker.on('query', query => {
            query.response([]);
        });
    });

    it("Activation without userId should fail",()=>{
        return expect(API.activations().activateUser()).rejects.toEqual("UserId wasn't specified");
    });

    it("Activation should resolve with values", () => {
        return expect(API.activations().activateUser(1)).resolves.toEqual(expect.objectContaining({
            code: expect.any(String)
        }));
    });
});
