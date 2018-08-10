
const API = require('../index').test();

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

test("Reformat the payment plan period", () => {
    const Utils = require('../core/Utility/Utils');
    return expect(Utils.planPeriod("2M")).toEqual("2 Month(s)")
});

test("Payment Plan Approval", () => {
    return expect(API.paymentPlans().approvePaymentPlan(4, {comments: "kkkk"}, {sub: 1}, API)).resolves.toEqual({});
});

test("Reject Plan Approval", () => {
    return expect(API.paymentPlans().rejectPaymentPlan(20, {comments: ""}, {sub: 1}, API)).resolves.toEqual({});
});


afterAll(async () => {
    await ctx.database.table("payment_plans").where("disc_order_id", 168157).del();
    await ctx.database.table("disconnection_billings").where("id", 168157).update({has_plan: 0});
});