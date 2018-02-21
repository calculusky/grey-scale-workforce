/**
 * Created by paulex on 9/6/17.
 */

let API = require('../API');

const config = require('../config.json');
const Context = require('../core/Context');
API = new API(new Context(config));

let workOrder = null;

beforeAll(()=> {
    return API.workOrders().createWorkOrder({
        type_id: 1,
        related_to: "disconnection_billings",
        relation_id: "12",
        labels: '["work"]',
        summary: "Fix it",
        status: '1',
        assigned_to: `[{"id": 1, "created_at": "18:02:14 12:0227"}]`,
        'issue_date': '2017/10/5'
    }, {group: 1}).then(data=> {
        workOrder = data.data.data;
        // console.log(data);
    }).catch(err=> {
        console.log(err);
    });
});

// test('Should resolve getWorkOrders to be defined', ()=> {
//     return expect(API.workOrders().getWorkOrders()).resolves.toBeDefined();
// });


test("Test that we can't create a work order with an invalid group id", ()=> {
    return expect(API.workOrders().createWorkOrder({
        type_id: 1,
        related_to: "disconnection_billings",
        relation_id: "2",
        labels: '["work"]',
        summary: "Fix it",
        assigned_to: `[{"id": 1, "created_at": "18:02:14 12:0227"}]`,
        status: '1',
        'issue_date': '2017/10/5'
    }, {group: 100000})).rejects.toThrow({
        err: {
            status: 'fail',
            data: {message: 'Group specified doesn\'t exist'}
        },
        code: 400
    });
});

test('That we can retrieve a work order by a column', ()=> {
    return API.workOrders().getWorkOrders('DROT-000004-468-02', 'work_order_no').then(res=> {
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


test("Retrieve list of work order", ()=> {
    return API.workOrders().getWorkOrders(`{"id":1}`, "assigned_to->[]").then(res=> {
        // console.dir(res.data.data);
        expect(res).toEqual(
            expect.objectContaining({
                code: expect.any(Number),
                data: expect.any(Object)
            })
        );
    });
});

test("Retrieve list of work order that its relation id doesn't exist should be excluded", ()=> {
    return API.workOrders().getWorkOrders({
        'assigned_to->[]': `{"id":1}`,
        'status': 1
    }, undefined, {group: 1}, 0, 10).then(res=> {
        expect(res).toEqual(
            expect.objectContaining({
                code: expect.any(Number),
                data: expect.any(Object)
            })
        );
    });
});

test("Retrieve list of work order within a specific date range", ()=> {
    return API.workOrders().getWorkOrdersBetweenDates(1, 1, '2018-02-09', '2018-02-15', 0, 10, {group: 1})
        .then(res=> {
            console.log(res);
            expect(res).toEqual(
                expect.objectContaining({
                    code: expect.any(Number),
                    data: expect.any(Object)
                })
            );
        });
});


afterAll(()=> {
    return API.workOrders().deleteWorkOrder("relation_id", "12");
});