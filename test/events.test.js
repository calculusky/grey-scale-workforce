require('dotenv').config();
let API = require('../API');

const config = require('../config.json');
const Context = require('../core/Context');
const ctx = new Context(config);
// API = new API(ctx);

const EmailEvent = require('../events/EmailEvent');
EmailEvent.init(ctx);


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