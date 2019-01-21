const [API, ctx] = require('../index').test();
const AuditAble = require('../core/AuditAble');
let WorkOrderMapper = require('../modules/WorkOrders/model/mappers/WorkOrderMapper');
let WorkOrder = require('../modules/WorkOrders/model/domain-objects/WorkOrder');

//Mock Knex Database
const knexMock = require('mock-knex');
const tracker = knexMock.getTracker();

beforeAll(async (done) => {
    tracker.install();
    knexMock.mock(ctx.db(), 'knex@0.15.2');
    tracker.on('query', query => {
        query.response([]);
    });
    await new Promise((res, rej) => {
        ctx.on('loaded_static', () => {
            ctx.setKey("groups", '{"1":{}}');
            res();
            done();
        });
    });
});

afterAll(async done => {
    await ctx.getPersistence().disconnect();
    knexMock.unmock(ctx.db(), 'knex@0.15.2');
    done();
});


it("Test audit", () => {
    const auditAble = AuditAble.getInstance();
    return expect(() => auditAble.audit()).toThrow(/Invalid arguments given/);
});

describe('Audit a record', () => {
    beforeAll(() => {
        tracker.on('query', (query) => {
            query.response([
                {id: 1}
            ]);
        });
    });

    it("Audit and confirm that an activity is created", () => {
        const auditAble = AuditAble.getInstance();
        const mapper = new WorkOrderMapper(ctx);
        const workOrder = new WorkOrder({id: 1});
        return expect(auditAble.audit(mapper, workOrder, {sub:1, group:[1]})).resolves.toMatchObject({
            data: {
                data: {
                    activity_type: "CREATE",
                    relation_id: 1
                }
            }
        });
    });
});
