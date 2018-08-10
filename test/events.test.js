
const API = require('../index').test();
// API = new API(ctx);

const EmailEvent = require('../events/EmailEvent');
const IntegratorEvent = require('../events/IntegratorEvent');
EmailEvent.init(ctx);
IntegratorEvent.init(ctx);


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
        id:3,
        category_id:2,
        status:1,
        priority:4,
        summary: "lorep posim",
        related_to:"assets",
        relation_id:"54"
    };
    const t = await IntegratorEvent.onFaultAdded(fault, {});
    expect(t).toEqual("err");
});

test("Events:onFaultUpdated", async () => {
    const t = await IntegratorEvent.onFaultUpdated(1, {});
    expect(t).toEqual("err");
});