/**
 * @type {API}
 */
/**
 * @field API {API}
 */
const [API, ctx] = require('../index').test();

//Mock Knex Database
const knexMock = require('mock-knex');
const tracker = knexMock.getTracker();


beforeAll(async (done) => {
    tracker.install();
    knexMock.mock(ctx.database, 'knex@0.15.2');
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
    knexMock.unmock(ctx.database, 'knex@0.15.2');
    done();
});

describe("Create Activities", () => {
    const who = {sub: 1};
    beforeAll(() => {
        tracker.on('query', query => {
            if(query.method === 'select' && query.sql.indexOf("`activities`")!==-1){
                return query.response([{
                    id: 1,
                    relation_id: 28,
                    module: "work_orders",
                    activity_type: "CREATE",
                    record: {id: 1, related_to: "faults"},
                    activity_by: 1,
                    group_id: 1,
                    created_at: "2018-11-01 15:42:00",
                    updated_at: "2018-11-01 15:42:00"
                }]);
            }
            return query.response([]);
        });
    });

    it("Should create an activity:", () => {
        return expect(API.activities().createActivity({
            module: "faults",
            relation_id: 12,
            activity_type: "create",
            description: "description!!!",
            activity_by: 1,
            group_id: `1`,
            source: "internal"
        }, who, API)).resolves.toEqual(
            expect.objectContaining({
                code: expect.any(Number),
                data: expect.any(Object)
            })
        );
    });

    test("That we can get activities by query", () => {
        expect.assertions(1);
        return API.activities().getActivities({
            module: "work_orders",
            relation_id: 28,
        }, {}, API).then(res => {
            expect(res).toEqual(expect.objectContaining({
                code: expect.any(Number),
                data: expect.any(Object)
            }))
        })
    });

});

