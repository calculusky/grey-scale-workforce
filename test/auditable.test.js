const [API, ctx] = require('../index').test();
const AuditAble = require('../core/AuditAble');
let WorkOrderMapper = require('../modules/WorkOrders/model/mappers/WorkOrderMapper');
let WorkOrder = require('../modules/WorkOrders/model/domain-objects/WorkOrder');
const globalMock = require('./setup/ApplicationDependency');

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


it("Audit Without required parameters should fail", () => {
    const auditAble = AuditAble.getInstance();
    return expect(() => auditAble.audit()).toThrow(/Invalid arguments given/);
});

describe('Audit Record', () => {
    beforeAll(() => {
        tracker.on('query', (query) => {
            query.response([
                {id: 1}
            ]);
        });
    });

    it("Audit should create an activity", () => {
        const auditAble = AuditAble.getInstance();
        const mapper = new WorkOrderMapper(ctx);
        const workOrder = new WorkOrder({id: 1});
        return expect(auditAble.audit(mapper, workOrder, session)).resolves.toMatchObject({
            data: {
                data: {
                    activity_type: "CREATE",
                    relation_id: 1
                }
            }
        });
    });
});
