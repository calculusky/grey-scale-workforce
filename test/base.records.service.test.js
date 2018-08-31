/**
 * @type {API}
 */
const API = require('../index').test();


test("Update fault delay reasons", () => {
    const body = {name:"tester"};
    return expect(API.baseRecords().updatePendingReason("id", "1", body , {sub: 1})).resolves.toEqual(expect.objectContaining({
        code: expect.any(Number),
        data: expect.any(Object)
    }));
});


test("Create Fault Categories", () => {
    const body = {
        name:"Category1",
        type:"HT_FAULT"
    };
    return expect(API.baseRecords().createFaultCategory(body , {sub: 1})).resolves.toEqual(expect.objectContaining({
        code: expect.any(Number),
        data: expect.any(Object)
    }));
});

test("Update Fault Categories", () => {
    const body = {
        name:"Category222"
    };
    return expect(API.baseRecords().updateFaultCategory("id", "185", body , {sub: 1})).resolves.toEqual(expect.objectContaining({
        code: expect.any(Number),
        data: expect.any(Object)
    }));
});
