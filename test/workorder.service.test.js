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
        related_to: "customers",
        relation_id: "2",
        labels: '["work"]',
        summary: "Fix it",
        status: '1',
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


test('Should list work orders and its related to entity', ()=> {
    return API.workOrders().getWorkOrders('DOSO00000135301', 'work_order_no').then(res=> {
        console.dir(res.data.data);
        expect(res).toEqual(
            expect.objectContaining({
                code: expect.any(Number),
                data: expect.any(Object)
            })
        );
    });
});


afterAll(()=> {
    return API.workOrders().deleteWorkOrder("relation_id", "2");
});