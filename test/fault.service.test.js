require('dotenv').config();
let API = require('../API');

const config = require('../config.json');
const Context = require('../core/Context');
const ctx = new Context(config);
API = new API(ctx);


test("Test that createFault is defined", () => {
    return expect(API.faults().createFault()).toBeDefined()
});

test("Test that createFault is rejects without a value", () => {
    return expect(API.faults().createFault()).rejects.toBeDefined()
});


test("Test that createFault is resolves with a value", () => {
    const fault = {
        category_id: 1,
        related_to: "assets",
        relation_id: "1",
        status: 1,
        summary: "test",
        group_id: 1,
        priority: 1,
    };
    return expect(API.faults().createFault(fault, {}, [], API)).resolves.toBeDefined()
});
