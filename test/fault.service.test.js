
    const API = require('../index').test();


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
        relation_id: "64",
        status: 1,
        summary: "test",
        group_id: 1,
        priority: 1,
        labels:[]
    };
    return expect(API.faults().createFault(fault, {}, [], API)).resolves.toBeDefined()
});


test("Test that we can update faults", () => {
    const fault = {
        category_id: 1,
        related_to: "assets",
        relation_id: "1",
        status: 3,
        summary: "Creeping",
        group_id: 1,
        priority: 3,
        assigned_to: '["2", "3"]'
    };

    return expect(API.faults().updateFault("id", 1, fault, {sub:1}, [], API)).resolves.toEqual({});
});

test("Test Faults", ()=>{
    return API.faults().getFaults({assigned_to:1}).then(res => {
        expect(res).toEqual(
            expect.objectContaining({
                code: expect.any(Number),
                data: expect.any(Object)
            })
        );
    });
});
// test("toAssignedTo", ()=>{
//    const Utils = require('../core/Utility/Utils');
//    return expect(Utils.toAssignedTo('["1"]')).toEqual([{"id":1}]);
// });
