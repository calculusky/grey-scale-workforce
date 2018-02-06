/**
 * Created by paulex on 9/6/17.
 */

let API = require('../API');

const config = require('../config.json');
const Context = require('../core/Context');
API = new API(new Context(config));

let workOrder = null;


// test('Should resolve getWorkOrders to be defined', ()=> {
//     return expect(API.workOrders().getWorkOrders()).resolves.toBeDefined();
// });


test('test that createPayment is defined', ()=> {
    return expect(API.payments().createPayment({}, {}, API)).rejects.toBeDefined();
});


test('test that createPayment is defined', ()=> {
    return expect(API.payments().createPayment({
        "system": "work_orders",
        "system_id": "DOSO00000135301",
        "amount": 200,
        "transaction_id": "string",
        "payer": "string",
        "channel": "string",
        "payment_date": "2018-02-06T01:36:18.118Z"
    }, {}, API)).resolves.toBeDefined();
});