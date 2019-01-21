/**
 * @field API {API}
 */
const [API, ctx] = require('../index').test();

//Mock Knex Database
const knexMock = require('mock-knex');
const tracker = knexMock.getTracker();


beforeAll(async (done) => {
    tracker.install();
    knexMock.mock(ctx.db(), 'knex@0.15.2');
    tracker.on('query', query => {
        query.response([]);
    });
    await new Promise((res, rej) => {
        ctx.on('loaded_static', () => {
            ctx.setKey("groups", '{"1":{}}');
            res();
            done();
        });
    });
});

afterAll(async done => {
    await ctx.getPersistence().disconnect();
    knexMock.unmock(ctx.db(), 'knex@0.15.2');
    done();
});

it("Activation activateUser should be defined", () => {
    return expect(API.activations().activateUser(1)).toBeDefined();
});

describe('Test Activations with database mock', () => {
    beforeAll(() => {
        tracker.on('query', query => {
            query.response([]);
        });
    });

    it("Fail if the userId is not supplied",()=>{
        return expect(API.activations().activateUser()).rejects.toEqual("UserId wasn't specified");
    });

    it("Activation should resolve", () => {
        return expect(API.activations().activateUser(1)).resolves.toEqual(expect.objectContaining({
            code: expect.any(String)
        }));
    });
});
