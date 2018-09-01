/**
 * Created by paulex on 9/6/17.
 */
let API = require('../index').test();

let workOrder = null;

beforeAll(() => {
    // return API.workOrders().createWorkOrder({
    //     type_id: 1,
    //     related_to: "disconnection_billings",
    //     relation_id: "12",
    //     labels: '["work"]',
    //     summary: "Fix it",
    //     status: '1',
    //     assigned_to: `["1"]`,
    //     'issue_date': '2017/10/5'
    // }, {group: 1}).then(data=> {
    //     workOrder = data.data.data;
    //     // console.log(data);
    // }).catch(err=> {
    //     console.log(err);
    // });
});

// test('Should resolve getWorkOrders to be defined', ()=> {
//     return expect(API.workOrders().getWorkOrders()).resolves.toBeDefined();
// });

test("Test that we can create a work order", () => {
    return expect(API.workOrders().createWorkOrder({
        type_id: 3,
        related_to: "disconnection_billings",
        relation_id: "2",
        labels: '["work"]',
        summary: "Fix it",
        assigned_to: `["1"]`,
        status: '1',
        group_id: 1,
        'issue_date': '2017/10/5'
    }, {group: 1})).resolves.toEqual({});
});

it("Should fail if an invalid type_id is supplied", () => {
    return expect(API.workOrders().createWorkOrder({
        type_id: 550,
        related_to: "disconnection_billings",
        relation_id: "2",
        labels: '["work"]',
        summary: "Fix it",
        assigned_to: `["1"]`,
        status: '1',
        group_id: 1,
        'issue_date': '2017/10/5'
    }, {group: 1})).rejects.toEqual(expect.objectContaining({
        code: 400,
        err: expect.objectContaining({
            code: "VALIDATION_ERROR"
        })
    }));
});

test("Test that we can't create a work order with an invalid group id", () => {
    return expect(API.workOrders().createWorkOrder({
        type_id: 1,
        related_to: "disconnection_billings",
        relation_id: "2",
        labels: '["work"]',
        summary: "Fix it",
        assigned_to: `["1"]`,
        status: '1',
        'issue_date': '2017/10/5'
    }, {group: 100000})).rejects.toEqual({
        err: {
            status: 'fail',
            data: {group_id: ["The group_id doesn't exist."]}
        },
        code: 400
    });
});

it("Should update a work order", () => {
    return API.workOrders().updateWorkOrder("id", 3, {
        summary: "Changerrrrr",
        status: 5
    }, {sub: 1}).then(res => {
        expect(res).toEqual(
            expect.objectContaining({
                code: expect.any(Number),
                data: expect.any(Object)
            })
        );
    })
});

test('That we can retrieve a work order by a column', () => {
    return API.workOrders().getWorkOrder('DROT00000417703', 'work_order_no').then(res => {
        console.log(res);
        expect(res).toEqual(
            expect.objectContaining({
                code: expect.any(Number),
                data: expect.any(Object)
            })
        );
        expect(res.data.data.items.length).toBeGreaterThan(0);
    });
});


test("Retrieve list of work order", () => {
    return API.workOrders().getWorkOrder(`{"id":1}`, "assigned_to->[]").then(res => {
        expect(res).toEqual(
            expect.objectContaining({
                code: expect.any(Number),
                data: expect.any(Object)
            })
        );
    });
});

test("Retrieve list of work order that its relation id doesn't exist should be excluded", () => {
    return API.workOrders().getWorkOrder({
        'assigned_to->[]': `{"id":1}`,
        'status': 1
    }, undefined, {group: 1}, 0, 10).then(res => {
        expect(res).toEqual(
            expect.objectContaining({
                code: expect.any(Number),
                data: expect.any(Object)
            })
        );
    });
});

test("Retrieve list of work order within a specific date range", () => {
    return API.workOrders().getWorkOrders(1, 1, '2018-04-07', '2018-04-15', 0, 10, {group: 1})
        .then(res => {
            console.log(res);
            expect(res).toEqual(
                expect.objectContaining({
                    code: expect.any(Number),
                    data: expect.any(Object)
                })
            );
        });
});

test("Retrieve material requisition that belongs to a work order", () => {
    return API.workOrders().getWorkOrderMaterialRequisitions(6, {includeOnly: "materials"}).then(r => {
        expect(r).toEqual({});
    })
});


test("Delete multiple work orders", ()=>{
    return API.workOrders().deleteMultipleWorkOrder([6, 2, 9], {sub:1}).then(r => {
        console.log(JSON.stringify(r));
        expect(r).toEqual(expect.objectContaining({
            code: expect.any(Number),
            data: expect.any(Object)
        }));
    })
});

afterAll(() => {
    return API.workOrders().deleteWorkOrder("relation_id", "12");
});