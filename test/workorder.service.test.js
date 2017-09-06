/**
 * Created by paulex on 9/6/17.
 */

let API = require('../API');
API = new API();
let workOrder = null;
beforeAll(()=> {
    return API.workOrders().createWorkOrder({
        type_id: 1,
        related_to: "customers",
        relation_id: "2",
        labels: '["work"]',
        summary: "Fix it",
        status: 1,
        'issue_date':'2017/10/5'
    }).then(data=> {
        workOrder = data.data.data;
    }).catch(err=>{
        console.log(err);
    });
});

it('Should resolve getWorkOrders to be defined', ()=> {
    return expect(API.workOrders().getWorkOrders()).resolves.toBeDefined();
});







afterAll(()=> {
    // return API.workOrders().deleteWorkOrder("relation_id", "2");
});