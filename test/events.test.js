/**
 * @type {API}
 */
const [API, ctx] = require('../index').test(); //Array Destructuring
const globalMock = require('./setup/ApplicationDependency');
const Utils = require('../core/Utility/Utils');

const EmailEvent = require('../events/EmailEvent');
const IntegratorEvent = require('../events/IntegratorEvent');
const ApplicationEvent = require('../events/ApplicationEvent');
const LocationEvent = require('../events/LocationEvent');
const MessageEvent = require('../events/MessageEvent');
const WebEvent = require('../events/WebEvent');

MessageEvent.init(ctx, undefined, API);

WebEvent.init(ctx, {
    sockets: {
        connected: {
            1: {
                emit: () => {
                }
            }
        }
    }
}, API, {clients: {1: [1, 2]}});

EmailEvent.init(ctx, undefined, API);
IntegratorEvent.init(ctx, undefined, API);
ApplicationEvent.init(ctx, undefined, API, {client: {1: 1}});
LocationEvent.init(ctx, {sockets: {adapter: {rooms: {"location_update_1": ["test_room"]}}}}, API, {clients: {1: 1}});

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

describe("EmailEvents", () => {

    beforeAll(() => {
        EmailEvent.sendEmail = jest.fn(() => true);
        tracker.on('query', query => {
            if (query.sql.indexOf('from `payment_plans`') !== -1) {
                return query.response([{
                    id: 1,
                    disc_order_id: 2,
                    period: "2M",
                    amount: 2000.29,
                    approval_status: 1,
                    approved_by: 1,
                    assigned_to: [{id: 1, created_at: '2018-11-01 11:52:01'}]
                }]);
            }
            else if (query.sql.indexOf('from `work_orders`') !== -1) {
                return query.response([{
                    id: 1,
                    assigned_to: [{id: 1, created_at: "20-01-2019"}]
                }]);
            }
            else if (query.sql.indexOf('from `users`') !== -1) {
                return query.response([{
                    id: 1,
                    username: "paulex10",
                    first_name: "Paul",
                    last_name: "Okeke",
                    wf_user_pass: "ac37cf7a8126c7db1595c03c5658a1f0"
                }]);
            }
        });
    });

    it("Events:OnPaymentPlanAssigned should run successfully", () => {
        return expect(EmailEvent.onPaymentPlanAssigned(1, [1])).resolves.toBeTruthy();
    });

    it("Events:onNotesAdded should run successfully", async () => {
        const body = {module: "work_orders", relation_id: 7, created_by: 3};
        return expect(EmailEvent.onNotesAdded(body, session)).resolves.toBeTruthy();
    });

    it("Events:onPaymentPlanApproval should run successfully", async () => {
        return expect(EmailEvent.onPaymentPlanApproval(1, session)).resolves.toBeTruthy();
    });

});

describe("Integrator Events", () => {

    beforeAll(() => {
        Utils.requestPromise = jest.fn(() => (Promise.resolve(true)));
        tracker.on('query', query => {
            if (query.sql.indexOf('from `assets`') !== -1) {
                return query.response([{
                    id: 1,
                    asset_name: "Example1",
                    status: 1,
                    ext_code: "222"
                }]);
            } else if (query.sql.indexOf('from `faults`') !== -1) {
                return query.response([{
                    id: 1,
                    fault_no: "ABC22",
                    related_to: "assets",
                    relation_id: "12",
                    labels: ["test", "abc"]
                }]);
            }
            return query.response([]);
        });
    });

    it("onFaultAdded Should fail if the fault source is not crm", () => {
        return expect(IntegratorEvent.onFaultAdded({source: 'crm'}, session)).resolves.toBeFalsy();
    });

    it("onFaultAdded Should run successfully", () => {
        const body = {
            relation_id: 1,
            category_id: 1
        };
        return expect(IntegratorEvent.onFaultAdded(body, session)).resolves.toBeTruthy();
    });

    it("onFaultUpdated should throw error if fault id is not set", () => {
        const body = {relation_id: 1,};
        return expect(IntegratorEvent.onFaultUpdated(body, session)).rejects.toThrowError("The fault.id is not set.");
    });

    it("onFaultUpdated Should run successfully", () => {
        const body = {
            relation_id: 1,
            category_id: 1,
            id: 1
        };
        return expect(IntegratorEvent.onFaultUpdated(body, session)).resolves.toBeTruthy();
    });
});


describe("Location Events", () => {

    beforeAll(() => {
        tracker.on('query', query => {
            if (query.sql.indexOf('from `users`') !== -1) {
                return query.response([{
                    id: 1,
                    username: "paulex10",
                    first_name: "Paul",
                    last_name: "Okeke",
                    gender: "M",
                    avatar: "test.jpg"
                }]);
            }
        });
    });

    it("onLocationUpdate should run successfully", () => {
        const data = {
            locations: [{
                lat: 13.0,
                lon: 22.1
            }]
        };
        LocationEvent.broadcastLocation = jest.fn(() => {
        });
        const socket = {id: 1};
        LocationEvent.onLocationUpdate(data, socket, session).then(res => {
            expect(res).toBeTruthy();
            return expect(LocationEvent.broadcastLocation).toHaveBeenCalled();
        });
    });
});


describe("Message Events", () => {
    beforeAll(() => {
        tracker.on('query', query => {
            if (query.sql.indexOf('from `users`') !== -1) {
                return query.response([{
                    id: 1,
                    username: "paulex10",
                    first_name: "Paul",
                    last_name: "Okeke",
                    gender: "M",
                    avatar: "test.jpg",
                    fire_base_token: []
                }]);
            }
            if (query.method === 'insert') {
                return query.response([1, {}]);
            }
        });
    });

    it("OnWorkOrderAssigned should run successfully", () => {
        const workOrder = {
            work_order_no: "number-10",
            summary: "A big difference",
            priority: "1"
        };
        return expect(MessageEvent.onWorkOrderAssigned(workOrder, [{id: 1}], session)).resolves.toBeTruthy();
    });

});

describe("Web Events", () => {

    beforeAll(() => {
        tracker.on('query', query => {
            if (query.sql.indexOf('from `users`') !== -1) {
                return query.response([{
                    id: 1,
                    username: "paulex",
                    first_name: "Paul",
                    last_name: "Okeke"
                }]);
            } else if (query.sql.indexOf('from `work_orders`') !== -1) {
                return query.response([{
                    id: 1,
                    assigned_to: [{id: 1, created_at: ""}]
                }]);
            }
        });
    });

    it("OnNotesAdded should fail when note object misses mandatory key", () => {
        const note = {};
        return expect(
            WebEvent.onNotesAdded(note, session)
        ).rejects.toThrowError("relation_id, module and note must be set in note");
    });

    it("OnNotesAdded should run successfully", () => {
        const note = {
            module: "work_orders",
            relation_id: "1",
            note: "Something happened"
        };
        return expect(WebEvent.onNotesAdded(note, session)).resolves.toBeTruthy();
    });

    it("OnUploadComplete should run successfully", () => {
        return expect(WebEvent.onUploadComplete("test", 1, "test.xlxs", 1)).resolves.toBeTruthy();
    });

});


describe("Application Events", () => {
    beforeAll(() => {
        tracker.on('query', query => {
            if (query.sql.indexOf('from `work_orders`') !== -1) {
                return query.response([{
                    id: 1,
                    assigned_to: [{id: 1, created_at: ""}],
                    status: 3,
                    type_id: 1,
                    relation_id: 3
                }]);
            }
        });
    });
    // it("OnWorkOrderUpdate should run successfully", () => {
    //     const workOrder = {id: 1, type_id: 1, status: 3, relation_id:3};
    //     const oldWorkOrder = {status: 2};
    //     return expect(ApplicationEvent.onWorkOrderUpdate(workOrder, session, oldWorkOrder)).resolves.toBeTruthy();
    // });

    // it("OnWorkOrderUpdate:faults should run successfully", () => {
    //     const workOrder = {id: 1, type_id: 3, status: 3, relation_id: 3};
    //     const oldWorkOrder = {status: 2};
    //     return expect(ApplicationEvent.onWorkOrderUpdate(workOrder, session, oldWorkOrder)).resolves.toBeTruthy();
    // });
});