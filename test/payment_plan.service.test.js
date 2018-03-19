require('dotenv').config();
let API = require('../API');

const config = require('../config.json');
const Context = require('../core/Context');
const ctx = new Context(config);
API = new API(ctx);

test("That createPaymentPlan is defined", () => {
    return expect(API.paymentPlans().createPaymentPlan()).toBeDefined();
});

test("That it rejects if the required fields are not set", async () => {
    const paymentPlan = {};
    return expect(API.paymentPlans().createPaymentPlan(paymentPlan)).rejects.toEqual(expect.objectContaining({
        code: expect.any(Number),
        err: {data: {message: expect.any(String)}, status: "fail"}
    }));
});

test("That it resolves after supplying the right fields", () => {
    const paymentPlan = {
        disc_order_id: '168157',
        period: '3M',
        amount: '4000',
        balance: '22596.936',
        waive_percentage: '50'
    };
    return expect(API.paymentPlans().createPaymentPlan(paymentPlan, {sub: 1}, API)).resolves
        .toEqual(expect.objectContaining({
            code: 200
        }));
});

test("Payment Plan Approval", () => {
    return expect(API.paymentPlans().approvePaymentPlan(1, {sub: 1}, API)).resolves.toEqual({});
});


afterAll(async () => {
    await ctx.database.table("payment_plans").where("disc_order_id", 168157).del();
    await ctx.database.table("disconnection_billings").where("id", 168157).update({has_plan: 0});
});