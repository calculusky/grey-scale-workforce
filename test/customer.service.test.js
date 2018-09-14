/**
 * @type {API}
 */
const API = require('../index').test();


test("fetch a single customer", () => {
    return expect(API.customers().getCustomer("0100002122", "account_no", {sub: 1})).resolves.toEqual(expect.objectContaining({
        code: expect.any(Number),
        data: expect.any(Object)
    }));
});

test("fetch a list of customers", () => {
    expect.assertions(1);
    return API.customers().getCustomers({meter_no:"54150022111"}).then(resp=>{
        expect(resp.data.data.items).toHaveLength(1)
    });
});