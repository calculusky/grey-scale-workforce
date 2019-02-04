/**
 * @type API
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


describe("Location History Creation and Retrieval", () => {

    beforeAll(() => {
        tracker.on('query', query => {
            if (query.sql.indexOf('from `groups`') !== -1) {
                return query.response([{
                    id: 1,
                    name: "Group A"
                }]);
            }
            return query.response([]);
        });
    });

    it("CreateLocationHistory should create a location history successfully", () => {
        const locationHistory = {
            module: "users",
            relation_id: "1",
            location: {
                x: 1.655342,
                y: 2.345334
            }
        };
        return expect(
            API.locations().createLocationHistory(locationHistory, session)
        ).resolves.toMatchObject({
            code: 200,
            data: {
                data: {
                    module: "users"
                }
            }
        });
    });


    it("GetLocationHistory", () => {
        const query = {group_id: 1};
        return expect(API.locations().getLocationHistory(query, session, API)).resolves.toMatchObject({
            code: 200,
            data: {
                data: {
                    items: []
                }
            }
        });
    });
});