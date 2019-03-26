/**
 * @type {API}
 */
let [API, ctx] = require('../index').test();
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

describe("Work Flow User and Groups", () => {

    beforeAll(() => {
        tracker.on('query', query => {
            if (query.sql.indexOf('from `users`') !== -1) {
                return query.response([{
                    id:1,
                    username:"paulex",
                    first_name:"Paul",
                    last_name:"Okeke",
                    wf_user_id:"dfsfsdfsdfdfsdfsdf"
                }]);
            }
        });
    });

    it("CreateUser should fail when empty object is inputted", async () => {
        return expect(API.workflows().createUser({}, session)).rejects.toBeFalsy();
    });
});

describe("Work Flow Cases", () => {

    beforeAll(() => {
        tracker.on('query', query => {
            if (query.sql.indexOf('from `users`') !== -1) {
               return query.response([{
                   id:1,
                   username:"paulex",
                   first_name:"Paul",
                   last_name:"Okeke",
                   wf_user_id:"dfsfsdfsdfdfsdfsdf"
               }]);
            }
        });
    });

    it("Starting a CASE", async () => {
        const domain = {
          waive_percentage: 20
        };
        return expect(API.workflows().startCase("payment_plan", session, domain)).resolves.toBeDefined();
    });
});