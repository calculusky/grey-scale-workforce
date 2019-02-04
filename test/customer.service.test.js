/**
 * @type API {API}
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

//#Test that we can create a customer
//#Test that the required fields are inserted when creating customer
//#Test that we can retrieve the customer created
//#Test that we can retrieve customers by query parameters
//#Test that we can get customer work orders
//#Test that we can delete a customer

describe("Customers Creation", () => {
    const customer = {
        account_no: "0100002122",
        customer_name: "Paul Okeke",
        customer_type: "residential",
    };

    beforeAll(() => {
        tracker.on('query', query => {
            if (query.method === 'insert') {
                return query.response([1, {
                    fieldCount: 0,
                    affectedRows: 1,
                }]);
            }
        });
    });

    it("CreateCustomer should fail if mandatory fields are missing", () => {
        return expect(API.customers().createCustomer({}, session)).rejects.toMatchObject({
            code: 400,
            err: {
                code: "VALIDATION_ERROR",
                data: {
                    account_no: ["The account no is required."],
                    customer_name: ["The customer name is required."]
                }
            }
        });
    });


    it("CreateCustomer should pass with mandatory fields", () => {
        return expect(API.customers().createCustomer(customer, session)).resolves.toMatchObject({
            code: 200,
            data: {data: customer}
        });
    });

});

describe("Retrieve Customer(s)", () => {
    const customer = {
        account_no: "0100002122",
        customer_name: "Paul Okeke",
        customer_type: "residential",
        created_at: "2018-10-31 13:33:10",
        updated_at: "2018-10-31 13:33:10"
    };

    beforeAll(() => {
        tracker.on('query', query => {
            return query.response([customer]);
        });
    });

    it("GetCustomer should return a single customer", () => {
        customer.assets = expect.any(Array);
        customer.business_unit = {
            id: 1,
            name: "Abule-Egba-BU"
        };
        customer.group_id = 1;
        return expect(API.customers().getCustomer("0100002122", "account_no", session)).resolves.toMatchObject({
            code: 200,
            data: {
                data: {items: [customer]}
            }
        });
    });

    it("GetCustomers should return customers that match query", () => {
        const queryParams = {
            status: 1,
            type: 3,
            tariff: "string"
        };
        delete customer.assets;
        return expect(API.customers().getCustomers(queryParams, session)).resolves.toMatchObject({
            code: 200,
            data: {
                data: {
                    items: [customer]
                }
            }
        });
    });


    it("SearchCustomers should return customers", () => {
        return expect(API.customers().searchCustomers("121232", session, 0, 10)).resolves.toMatchObject({
            code: 200,
            data: {
                data: {
                    items: [customer]
                }
            }
        });
    });

});


describe("Customers Related Data", () => {
    const workOrderData = {
        id: 222,
        related_to: "faults",
        relation_id: "1",
        type_id: 3,
        assigned_to: {
            id: 1, created_at: "2018-11-01 11:52:01"
        }
    };
    beforeAll(() => {
        tracker.on('query', query => {
            if (query.sql.indexOf("disconnection_billings") !== -1) {
                return query.response([{
                    id: 1,
                    account_no: "01010101",
                    work_order_id: 22,
                    current_bill: 2000.1
                }])
            } else if (query.sql.indexOf("assets") !== -1) {
                return query.response([{
                    id: 1,
                    asset_name: "Example Asset",
                    status: 1
                }])
            } else if (query.sql.indexOf("faults") !== -1) {
                return query.response([{
                    id: 1,
                    related_to: "assets",
                    relation_id: 1
                }]);
            } else if (query.sql.indexOf("work_orders") !== -1) {
                return query.response([workOrderData]);
            }
            return query.response([]);
        });
    });


    it("GetCustomerWorkOrders should return customer work orders with related entity", () => {
        const DisconnectionBilling = require('../modules/DisconnectionBillings/model/domain-objects/DisconnectionBilling');
        const WorkOrder = require('../modules/WorkOrders/model/domain-objects/WorkOrder');
        const workOrder = new WorkOrder(workOrderData);
        workOrder.disconnections = new DisconnectionBilling({
            id: 1,
            account_no: "01010101",
            work_order_id: 22,
            current_bill: 2000.1
        });
        return expect(API.customers().getCustomerWorkOrders("01010101", session)).resolves.toMatchObject({
            code: 200,
            data: {
                data: {
                    items: [workOrder, expect.any(WorkOrder)]
                }
            }
        })
    });
});


describe("Customer Deletion", ()=>{
    it("DeleteCustomer should resolve", ()=>{
        return expect(API.customers().deleteCustomer(undefined, "101010", session)).resolves.toMatchObject({
            code : 200,
            data:{
                data:{message:"Customer successfully deleted."}
            }
        })
    });
});


describe("Customers DataTable", ()=>{
    it("GetCustomerTableRecords should fetch customer records in dataTable format", ()=>{
        return expect(API.customers().getCustomerTableRecords({}, session)).resolves.toMatchObject({
            data:[]
        });
    });
});