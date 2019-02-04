/**
 * @type {API}
 */
/**
 * @field API {API}
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

describe("Create Activities", () => {
    beforeAll(() => {
        tracker.on('query', query => {
            return query.response([1, {}]);
        });
    });

    it("CreateActivity should fail when mandatory fields are missing", ()=>{
        return expect(API.activities().createActivity({}, session, API)).rejects.toMatchObject({
            code:400,
            err:{
                data:{
                    module:["The module is required."],
                    relation_id:["The relation id is required."],
                    activity_type:["The activity type is required."]
                }
            }
        })
    });

    it("CreateActivity Should create an activity successfully", () => {
        const body = {
            module: "faults",
            relation_id: 12,
            activity_type: "create",
            description: "description!!!",
            activity_by: 1,
            group_id: `1`,
            source: "internal"
        };

        return expect(API.activities().createActivity(body, session, API)).resolves.toMatchObject({
            code: 200,
            data: {
                data: body
            }
        });
    });
});

describe("Retrieve Activities", () => {
    beforeAll(() => {
        tracker.on('query', query => {
            if (query.method === 'select' && query.sql.indexOf("`activities`") !== -1) {
                return query.response([{
                    id: 1,
                    relation_id: 28,
                    module: "work_orders",
                    activity_type: "CREATE",
                    record: {id: 1, related_to: "faults", status: "new"},
                    activity_by: 1,
                    group_id: 1,
                    created_at: "2018-11-01 15:42:00",
                    updated_at: "2018-11-01 15:42:00"
                }, {
                    id: 1,
                    relation_id: 28,
                    module: "work_orders",
                    activity_type: "UPDATE",
                    record: {id: 1, related_to: "faults", status: "pending"},
                    activity_by: 1,
                    group_id: 1,
                    created_at: "2018-11-01 15:42:00",
                    updated_at: "2018-11-01 15:42:00"
                }]);
            } else if (query.sql.indexOf('from `users`') !== -1) {
                return query.response([{
                    id:1,
                    username:"paulex10",
                    first_name:"Paul",
                    last_name:"Okeke",
                }])
            }
            return query.response([]);
        });
    });

    it("That we can get activities by query", () => {
        expect.assertions(1);
        return API.activities().getActivities({module: "work_orders", relation_id: 28}, session, API).then(res => {
            expect(res).toMatchObject({
                code: 200,
                data: {
                    data: {
                        items: [expect.any(Object),{
                            "by": {
                                "first_name": "Paul",
                                "id": 1,
                                "last_name": "Okeke",
                                "username": "paulex10"
                            },
                            "event_time": "2018-11-01 15:42:00",
                            "event_type": "UPDATE",
                            "field_name": "status",
                            "field_value": "pending",
                            "old_value": "new"
                        }]
                    }
                }
            })
        })
    });
});

