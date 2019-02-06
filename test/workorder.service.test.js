/**
 * Created by paulex on 9/6/17.
 */
const [API, ctx] = require('../index').test();
const globalMock = require('./setup/ApplicationDependency');
const WorkOrder = require('../modules/WorkOrders/model/domain-objects/WorkOrder');

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

describe("Work Order Creation", () => {

    beforeAll(() => {
        tracker.on('query', query => {
            if (query.method === 'insert') {
                return query.response([1, {
                    fieldCount: 0,
                    affectedRows: 1,
                }])
            }
        });
    });

    it("CreateWorkOrder Should fail when an invalid type_id is supplied", () => {
        return expect(API.workOrders().createWorkOrder({
            type_id: 550,
            related_to: "disconnection_billings",
            relation_id: "2",
            labels: '["work"]',
            summary: "Fix it",
            assigned_to: `["1"]`,
            status: '1',
            group_id: 1,
            'issue_date': '2019-10-05'
        }, session, API, [])).rejects.toEqual(expect.objectContaining({
            code: 400,
            err: expect.objectContaining({
                code: "VALIDATION_ERROR"
            })
        }));
    });

    it("CreateWorkOrder should create a work order successfully", () => {
        const workOrderDummy = {
            type_id: 3,
            related_to: "disconnection_billings",
            relation_id: "2",
            labels: '["work"]',
            summary: "Fix it",
            assigned_to: `["1"]`,
            status: '1',
            group_id: 1
        };
        return expect(API.workOrders().createWorkOrder(workOrderDummy, session, API)).resolves.toMatchObject({
            code: 200,
            data: {
                data: Object.assign(workOrderDummy, {assigned_to: expect.any(Array), labels: expect.any(Array)})
            }
        });
    });

    it("CreateGroup should fail when an invalid group_id is given", () => {
        const workOrderDummy = {
            type_id: 3,
            related_to: "disconnection_billings",
            relation_id: "2",
            labels: '["work"]',
            summary: "Fix it",
            assigned_to: `["1"]`,
            status: '1',
            group_id: 3232,
            'issue_date': '2019-12-05'
        };
        return expect(API.workOrders().createWorkOrder(workOrderDummy, session, API)).rejects.toMatchObject({
            code: 400,
            err: {
                data: {
                    group_id: ["The group_id doesn't exist."]
                }
            }
        });
    });

});

describe("WorkOrder Update", () => {

    beforeAll(() => {
        tracker.on('query', query => {
            if (query.sql.indexOf('from `work_orders`') !== -1) {
                return query.response([{
                    id: 3,
                    type_id: 2,
                    relation_id: 22,
                    work_order_no: "SOMETHING"
                }])
            }
        });
    });

    it("UpdateGroup should update the group successfully", () => {
        return expect(API.workOrders().updateWorkOrder("id", 3, {
            summary: "Changerrrrr",
            status: 5
        }, session)).resolves.toMatchObject({
            code: 200,
            data: {
                data: {
                    id: 3,
                    type_id: 2,
                    summary: "Changerrrrr",
                    status: 5,
                    updated_at: expect.any(String)
                }
            }
        })
    });
});

describe("Retrieve Work Orders", () => {

    const dummyWorkOrder = {
        id: 1,
        related_to: "faults",
        relation_id: "1",
        work_order_no: "FIEQ00000268711",
        type_id: 3,
        summary: "Clear up the bush.",
        start_date: "",
        created_by: 1
    };

    beforeAll(() => {
        tracker.on('query', query => {
            if (query.sql.indexOf('from `work_orders`') !== -1) {
                return query.response([dummyWorkOrder]);
            } else if (query.sql.indexOf('from `faults`') !== -1) {
                return query.response([{
                    id: 1,
                    fault_no: "",
                    related_to: "assets",
                    relation_id: "1",
                    fault_category_id: 1
                }])
            } else if (query.sql.indexOf('from `users`') !== -1) {
                return query.response([{
                    id: 1,
                    username: "paulex10",
                    first_name: "Paul",
                    last_name: "Okeke"
                }]);
            }
        });
    });

    const workOrder = new WorkOrder(dummyWorkOrder);

    it("GetWorkOrders should successfully return a list of work orders", () => {
        const query = {
            from_date: "2018-11-01 17:30:49",
            to_date: "2018-11-01 17:30:49"
        };
        const extraData = {
            work_order_no: "FIEQ-000002-687-11",
            faults: {
                id: 1,
                related_to: "assets",
                relation_id: "1",
                category: expect.any(Object),
                asset: {}
            },
            created_by: {
                id: 1,
                username: "paulex10",
                first_name: "Paul",
                last_name: "Okeke"
            }
        };
        return expect(API.workOrders().getWorkOrders(query, session)).resolves.toMatchObject({
            code: 200,
            data: {
                data: {
                    items: [Object.assign(workOrder, extraData)]
                }
            }
        });
    });

});

describe("Work Order Relations", () => {

    beforeAll(() => {
        tracker.on('query', query => {
            if (query.sql.indexOf('from `material_requisitions`') !== -1) {
                return query.response([{
                    id: 1,
                    materials: [{"id": "1", "qty": "3"}, {"id": "9", "qty": "3"}],
                    work_order_id: 6,
                    status: 2,
                    description: "Gimme Sometime.",
                    requested_by: 1
                }])
            } else if (query.sql.indexOf('from `materials`') !== -1) {
                query.response([{
                    id: 1,
                    name: "Length 111 Pipe",
                    unit_price: 2054.40,
                    total_quantity: 33,
                    unit_of_measurement: "CM"
                }])
            }
        });
    });

    it("GetWorkOrderMaterialRequisitions should retrieve material requisition belonging to a work order", () => {
        const query = {};
        return expect(API.workOrders().getWorkOrderMaterialRequisitions(6, query, session, API)).resolves.toMatchObject({
            code: 200,
            data: {
                data: {
                    items: [{
                        id: 1,
                        status: 2,
                        description: "Gimme Sometime.",
                        materials: [{
                            id: 1,
                            name: "Length 111 Pipe",
                            unit_price: 2054.40,
                            total_quantity: 33,
                            unit_of_measurement: "CM"
                        }]
                    }],
                    work_order_id: 6
                }
            }
        });
    });

});

describe("Multiple Update and Delete", () => {

    beforeAll(() => {
        tracker.on('query', query => {
            if (query.bindings[0] !== '6' && query.sql.indexOf('from `work_orders`') !== -1) {
                return query.response([{
                    id: 1,
                    work_order_no: "",
                    type_id: 1
                }])
            }
            return query.response([]);
        });
    });

    it("UpdateMultipleWorkOrders should return appropriate response code for action", () => {
        const body = {
            5: {summary: "yEs5"},
            6: {summary: "yEs6"},
            7: {summary: "yEs7"}
        };
        return expect(API.workOrders().updateMultipleWorkOrders(body, session, API)).resolves.toMatchObject({
            code: 200,
            data: {
                data: [200, 404, 200]
            }
        });
    });


    it("Delete multiple work orders", () => {
        return API.workOrders().deleteMultipleWorkOrder([6, 2, 9], session).then(r => {
            expect(r).toEqual(expect.objectContaining({
                code: expect.any(Number),
                data: expect.any(Object)
            }));
        })
    });

});



