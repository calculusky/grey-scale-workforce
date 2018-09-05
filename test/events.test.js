/**
 * @type {API}
 */
const API = require('../index').test();
// API = new API(ctx);

const EmailEvent = require('../events/EmailEvent');
const IntegratorEvent = require('../events/IntegratorEvent');
const ApplicationEvent = require('../events/ApplicationEvent');
EmailEvent.init();
IntegratorEvent.init();
ApplicationEvent.init(undefined, undefined, API, {});


test("Egg", async () => {
    const t = await EmailEvent.onPaymentPlanAssigned(1, [1]);
    expect(t).toEqual("erer");
});


test("Events:onNotesAdded", async () => {
    const t = await EmailEvent.onNotesAdded({
        module: "disconnection_billings",
        relation_id: 7,
        created_by: 3
    }, {sub: 3});
    expect(t).toEqual("erer");
});


test("Events:onFaultAdded", async () => {
    const fault = {
        id: 3,
        category_id: 2,
        status: 1,
        priority: 4,
        summary: "lorep posim",
        related_to: "assets",
        relation_id: "54"
    };
    const t = await IntegratorEvent.onFaultAdded(fault, {});
    expect(t).toEqual(1);
});

test("Events:onFaultUpdated", async () => {
    const t = await IntegratorEvent.onFaultUpdated(3, {});
    expect(t).toEqual("1");
});

test("Events:onRoleUpdated", async ()=>{
    const t = await ApplicationEvent.onRoleUpdated({permissions:{name:"2"}}, {}, {permissions:{name:"22"}});
    expect(t).toEqual("err");
});


it("Events:onFaultAdded", async () => {
    const Fault = require('../modules/Faults/model/domain-objects/Fault');
    const fault = new Fault({
        id: 2,
        related_to: "assets",
        relation_id: 1071
    });
    expect.assertions(1);
    const t = await ApplicationEvent.onFaultAdded(fault, {sub: 1});
    expect(t).toBeTruthy();
});

it("Events:onWorkOrderUpdate", async () => {
    const WorkOrder = require('../modules/WorkOrders/model/domain-objects/WorkOrder');
    const workOrder = new WorkOrder({
        id: 2,
        related_to: "faults",
        relation_id: 1,
        status: 4,
        type_id:3
    });
    expect.assertions(1);
    const t = await ApplicationEvent.onWorkOrderUpdate(workOrder, {sub: 1}, {});
    expect(t).toBeTruthy();
});