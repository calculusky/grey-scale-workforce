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

describe("Notification Creation", () => {

    beforeAll(() => {
        tracker.on('query', query => {
            if (query.method === 'insert') {
                return query.response([1, {
                    fieldCount: 0,
                    affectedRows: 1,
                }])
            }
        });
    });

    it("CreateNotification should fail when mandatory fields are missing", () => {
        return expect(API.notifications().createNotification()).rejects.toMatchObject({
            code: 400,
            err: {
                data: {
                    type: ['The type is required.'],
                    message: ['The message is required.'],
                    from: ['The from is required.'],
                    to: ['The to is required.']
                }
            }
        })
    });

    it("CreateNotification should create a notification successfully", () => {
        const notification = {
            type: "work_orders",
            message: "Attend to this work order",
            from: 1,
            to: [2, 4]
        };
        return expect(API.notifications().createNotification(notification, session)).resolves.toMatchObject({
            code: 200,
            data: {
                data: Object.assign(notification, {id: 1})
            }
        });
    });

});

describe("Notification Updates", () => {


    it("UpdateNotification should update successfully", () => {
        const notif = {status: 1};
        return expect(API.notifications().updateNotification(1, 'id', notif, session, API)).resolves.toMatchObject({
            code: 200,
            data: {
                data: {
                    id: 1,
                    status: 1
                }
            }
        });
    });


    it("UpdateMultipleNotifications should update successfully", () => {
        const multi = {
            1: {status: 1},
            2: {status: 3}
        };

        return expect(API.notifications().updateMultipleNotifications(multi, session, API)).resolves.toMatchObject({
            code: 200,
            data: {
                data: [200, 200]
            }
        })
    });

});


describe("Pushing Notifications", () => {

    beforeAll(() => {
        tracker.on('query', query => {
            if (query.sql.indexOf('from `users`') !== -1) {
                return query.response([{
                    fire_base_token: ["abcdefgh", "tested"]
                }]);
            }
            if (query.method === 'insert') {
                return query.response([1, {}])
            }
        });
        const request = require('request');
        request.post = jest.fn((opt, callback) => {
            const body = {failure: 0, canonical_ids:0};
            return callback(null, {}, body);
        });
    });

    it("SendNotification should successfully send notification to a device", () => {
        const body = {
            from: 1,
            type: "work_orders",
            message: "Fix the issue",
            to: [1, 2]
        };
        return expect(API.notifications().sendNotification(body, session, API)).resolves.toMatchObject({
            code: 200,
            data: {
                data: Object.assign(body, {to: "[1,2]"})
            }
        })
    });
});