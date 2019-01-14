/**
 * @param API {API}
 */
let [API, ctx] = require('../index').test();

test("Should throw error if the required fields are not specified", () => {
    return expect(API.disconnections().createDisconnectionBilling({}, {}, [], API)).rejects.toEqual(expect.objectContaining({
        code: 400,
        err: expect.any(Object)
    }));
});

test("Test that we can create a disconnection billing", () => {
    const disconnections = {account_no: '0100656722', current_bill: 3000, arrears: 2000};
    return expect(API.disconnections().createDisconnectionBilling(disconnections, {}, [], API))
        .resolves.toEqual(expect.objectContaining({
            code: 200,
            data: expect.any(Object)
        }));
});

it("Should fail if customer doesn't exist", () => {
    const disconnections = {account_no: '01006567PP', current_bill: 3000, arrears: 2000};
    return expect(API.disconnections().createDisconnectionBilling(disconnections, {}, [], API))
        .rejects.toEqual(expect.objectContaining({
            code: 400,
            err: expect.any(Object)
        }));
});

it("Should fail if we pass a work order that isn't valid along a disconnection", () => {
    const disconnections = {
        account_no: '0100656722',
        current_bill: 3000,
        arrears: 2000,
        work_order: {}
    };
    return expect(API.disconnections().createDisconnectionBilling(disconnections, {}, [], API))
        .rejects.toEqual(expect.objectContaining({
            code: 400,
            err: expect.any(Object)
        }));
});

it("Should Should successfully create a disconnection and a work order", () => {
    const disconnections = {
        account_no: '0100656722',
        current_bill: 3000,
        arrears: 2000,
        work_order: {
            issue_date:"2019-01-08",
            summary:"Disconnection Customers",
            status:1
        }
    };
    return expect(API.disconnections().createDisconnectionBilling(disconnections, {sub:1, group:[1]}, [], API))
        .resolves.toEqual(expect.objectContaining({
            code: 200,
            data: expect.any(Object)
        }));
});