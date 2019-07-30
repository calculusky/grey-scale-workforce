const [API, ctx] = require('../index').test();
const globalMock = require('./setup/ApplicationDependency');
const main = require('../schedulers/main')(ctx, API);

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

describe("Schedule Faults Update", () => {
    const ApplicationEvent = require('../events/ApplicationEvent');
    beforeAll(() => {
        tracker.on('query', query => {
            if (query.sql.indexOf('from `work_orders`') !== -1) {
                return query.response([{
                    id: 1,
                    status: 4,
                    relation_id: 44,
                    assigned_to: 2,
                    completed_date: "2019-07-30T19:36:14.000Z"
                },
                    {
                        id: 2,
                        status: 4,
                        relation_id: 44,
                        assigned_to: 2,
                        completed_date: null
                    }
                ]);
            } else if (query.sql.indexOf('from `faults`') !== -1) {
                return query.response({
                    id: 44,
                    status: 2,
                    relation_id: 1,
                    assigned_to: 2,
                });
            }
        });
        API.activities().getActivities = jest.fn(() => {
            return Promise.resolve({
                code: 200,
                data: {
                    data: {
                        items: [{
                            "by": {
                                "first_name": "Paul",
                                "id": 1,
                                "last_name": "Okeke",
                                "username": "paulex10"
                            },
                            "event_time": "2019-07-30T19:36:14.000Z",
                            "event_type": "UPDATE",
                            "field_name": "status",
                            "field_value": "Closed",
                            "old_value": "new"
                        }]
                    }
                }
            })
        });
    });

    it("scriptUpdateFaults: test that we can close faults that all work orders are closed", async () => {
        ApplicationEvent.modifyFaultStatusByTotalWorkOrderStatus = jest.fn(()=>(Promise.resolve()));
        API.workOrders().updateWorkOrder = jest.fn(()=>(Promise.resolve(true)));
        const updateWorkOrder = jest.spyOn(API.workOrders(), 'updateWorkOrder');
        const modifyFaultStatus = jest.spyOn(ApplicationEvent, 'modifyFaultStatusByTotalWorkOrderStatus');
        const compDate = {completed_date:"2019-07-30 19:36:14"};

        //Act
        const value = await main.scriptUpdateFaults(ctx);

        //Assert
        expect(updateWorkOrder).toHaveBeenCalledWith("id", 2, compDate, session, [], API);
        expect(modifyFaultStatus).toHaveBeenLastCalledWith(44, session, "2019-07-30 19:36:14", "Closed", "Cancelled");

        return expect(value).toBeTruthy();
    });
});


