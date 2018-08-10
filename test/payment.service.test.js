/**
 * Created by paulex on 9/6/17.
 */

const API = require('../index').test();



test('Test that createPayment without no input data rejects with a defined value', ()=> {
    return expect(API.payments().createPayment({}, {}, API)).rejects.toBeDefined();
});


test('test that createPayment is defined', ()=> {
    return expect(API.payments().createPayment({
        "system": "work_orders",
        "system_id": "DROT00000582703",
        "amount": 76000,
        "transaction_id": "gross",
        "payer": "string",
        "channel": "string",
        "payment_date": "2018-02-06T01:36:18.118Z"
    }, {}, API)).resolves.toBeDefined();
});