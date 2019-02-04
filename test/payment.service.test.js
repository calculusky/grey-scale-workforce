/**
 * Created by paulex on 9/6/17.
 */

const [API, ctx] = require('../index').test();
const globalMock = require('./setup/ApplicationDependency');

/**
 * @param session {Session}
 */
let knexMock, tracker, session;

beforeAll(async (done) => {
    [knexMock, tracker, session] = await globalMock.applicationBeforeAll(ctx);
    done();
});

afterAll(async done => {
    await ctx.getPersistence().disconnect();
    knexMock.unmock(ctx.db(), 'knex@0.15.2');
    done();
});

describe("Payment Creation", () => {

    beforeAll(() => {
        tracker.on('query', query => {
            if (query.sql.indexOf('from `work_orders`') !== -1) {
                return query.response([{
                    id: 1,
                    work_order_no: "DROOT00001799611",
                    related_to: "disconnection_billings",
                    relation_id: "1",
                    type_id: 1,
                    status: 3,
                    group_id: 1
                }]);
            }
            if (query.sql.indexOf('from `disconnection_billings`') !== -1) {
                return query.response([{
                    id: 1,
                    account_no: "0100656006",
                    work_order_id: "DROOT00001799611",
                    min_amount_payable: 76000,
                    total_amount_payable: 76000,
                    has_plan: 0
                }]);
            }
            return query.response([]);
        });
    });

    it('CreatePayment should fail when mandatory fields are missing', () => {
        return expect(API.payments().createPayment({}, {}, API)).rejects.toMatchObject({
            code: 400,
            err: {
                data: {
                    system: ["The system is required."],
                    system_id: ["The system id is required."],
                    amount: ["The amount is required."],
                    transaction_id: ["The transaction id is required."],
                    payer: ["The payer is required."],
                    channel: ["The channel is required."]
                }
            }
        });
    });

    it('CreatePayment should create a payment record successfully', () => {
        const body = {
            "system": "work_orders",
            "system_id": "DROT00000582703",
            "amount": 76000,
            "transaction_id": "gross",
            "payer": "string",
            "channel": "string",
            "auto_generate_rc":"true"
        };
        return expect(API.payments().createPayment(body, session, API)).resolves.toMatchObject({
            code: 200,
            data: {
                data: {
                    "system": "work_orders",
                    "system_id": "DROT00000582703",
                    "amount": 76000,
                    "transaction_id": "gross",
                    "payer": "string",
                    "channel": "string"
                }
            }
        });
    });

});