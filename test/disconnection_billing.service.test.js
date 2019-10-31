/**
 * @param API {API}
 */
let [API, ctx] = require('../index').test();
const DisconnectionBilling = require('../modules/DisconnectionBillings/model/domain-objects/DisconnectionBilling');
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

function registerGeneralTracker() {
    tracker.on('query', query => {
        if (query.sql.indexOf("customers") !== -1 && !query.bindings.includes("01006567PP")) {
            return query.response([{
                account_no: "0100656722",
                customer_name: "Paul Okeke",
                status: 1,
                tariff: "rstp"
            }])
        }
        if (query.method === 'insert') {
            return query.response([1, {
                fieldCount: 0,
                affectedRows: 1,
            }]);
        }
        if (query.sql.indexOf('`amount` from `rc_fees`') !== -1) {
            return query.response([{
                id: 1,
                name: "R2STP",
                amount: 3000.00
            }])
        }
    });
}

describe("Create Disconnection Billing", () => {

    beforeAll(() => {
        registerGeneralTracker();
    });

    test("Should throw error if the required fields are not specified", () => {
        return expect(API.disconnections().createDisconnectionBilling({}, session, API)).rejects.toEqual(expect.objectContaining({
            code: 400,
            err: expect.any(Object)
        }));
    });

    it("Test that we can create a disconnection billing", () => {
        const disconnections = {account_no: '0100656722', current_bill: 3000, arrears: 2000, assigned_to: '["1"]'};
        const disconnection = new DisconnectionBilling(disconnections);
        disconnection.setReconnectionFee(3000);
        disconnection.calculateMinAmount();
        disconnection.calculateTotalAmount();
        disconnection.serializeAssignedTo();

        return expect(API.disconnections().createDisconnectionBilling(disconnections, session, API)).resolves.toMatchObject({
            code: 200,
            data: {
                data: disconnection
            }
        });
    });

    it("Should fail if customer doesn't exist", () => {
        const disconnections = {account_no: '01006567PP', current_bill: 3000, arrears: 2000};
        return expect(API.disconnections().createDisconnectionBilling(disconnections, session, API))
            .rejects.toEqual(expect.objectContaining({
                code: 400,
                err: {data: {"account_no": ["The account_no doesn't exist."]}, status: "fail"},
            }));
    });


});


describe("CreateDisconnectionBilling with WorkOrder", () => {

    beforeAll(() => {
        registerGeneralTracker();
    });

    it("Should fail if we pass a work order without mandatory fields", () => {
        const disconnections = {
            account_no: '0100656722',
            current_bill: 3000,
            arrears: 2000,
            work_order: {}
        };
        return expect(API.disconnections().createDisconnectionBilling(disconnections, session, API))
            .rejects.toMatchObject({
                code: 400,
                err: {
                    code: "VALIDATION_ERROR", data: {
                        summary: ["The summary is required."]
                    }
                }
            });
    });

    it("CreateDisconnectionBilling should delete billing record if work order fails to create", () => {
        const disconnections = {
            account_no: '0100656722',
            current_bill: 3000,
            arrears: 2000,
            work_order: {}
        };
        const deleteFn = jest.spyOn(API.disconnections(), "deleteDisconnectionBilling");
        return API.disconnections().createDisconnectionBilling(disconnections, session, API).catch(() => {
            return expect(deleteFn).toHaveBeenCalled();
        });
    });


    it("Should successfully create a disconnection and a work order", async () => {
        const disconnections = {
            account_no: '0100656722',
            current_bill: 3000.56,
            arrears: 2000.67,
            work_order: {
                issue_date: "2019-01-08",
                summary: "Disconnection Customers",
                status: 1
            }
        };
        const {data} = await API.disconnections().createDisconnectionBilling(disconnections, session, API);
        const totalAmountPayable = data.data.total_amount_payable;

        expect(totalAmountPayable).toEqual(8001.23);
        expect(data).toEqual(expect.objectContaining({
            status: 'success',
            data: expect.any(Object)
        }));

    });
});


describe("Disconnection Billing DataTable", () => {
    beforeAll(() => {
        tracker.on('query', query => {
            if (query.sql.indexOf('select count') !== -1) {
                return query.response([{
                    cnt: 1,
                }]);
            }
            return query.response([]);
        });
    });
    it("GetDisconnectionBillingDataTableRecords should fetch disconnection records in dataTable format", () => {
        return expect(API.disconnections().getDisconnectionBillingDataTableRecords({}, session)).resolves.toMatchObject({
            data: []
        });
    });
});
