/**
 * Created by paulex on 6/02/18.
 */

/**
 * @type API {API}
 */
let [API, ctx] = require('../index').test();
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


describe("Material Requisition Creation", () => {

    beforeAll(() => {
        tracker.on('query', query => {
            if (query.method === 'insert') {
                return query.response([1, {
                    fieldCount: 0,
                    affectedRows: 1
                }])
            }
        });
    });

    it("Should fail when passed empty data", () => {
        return expect(API.materialRequisitions().createMaterialRequisition({}, session)).rejects.toMatchObject({
            code: 400,
            err: {
                code: "VALIDATION_ERROR",
                data: {
                    materials: ["The materials is required."],
                    requested_by: ["The requested by is required."],
                }
            }
        });
    });

    it("That materialRequisition is created", () => {
        const body = {
            materials: [{"id": "20", "qty": "10", category: {id: 1}}],
            requested_by: 1,
            status: 1
        };
        return expect(API.materialRequisitions().createMaterialRequisition(body, session)).resolves.toMatchObject({
            code: 200,
            data: {
                data: body
            }
        });
    });

});

describe("Material Requisition Update", () => {

    beforeAll(() => {
        tracker.on('query', query => {
            if (query.sql.indexOf('from `material_requisitions`') !== -1) {
                return query.response([{
                    id: 1,
                    materials: [{id: 1, qty: 22}]
                }]);
            }
        });
    });

    it("UpdateMaterialRequisition should successfully update a material requisition", () => {
        const body = {status: 2};
        return expect(
            API.materialRequisitions().updateMaterialRequisition('id', 1, body, session, [], API)
        ).resolves.toMatchObject({
            code: 200,
            data: {
                data: body
            }
        });
    });

});

describe("Retrieve Material Requisitions", () => {

    beforeAll(() => {
        tracker.on('query', query => {
            if (query.sql.indexOf('from `material_requisitions`')) {
                return query.response([{
                    id: 1,
                    materials: [{id: 1, qty: 2}],
                    requested_by: 1
                }]);
            }
        });
    });

    it("GetMaterialRequisition should be defined", () => {
        return expect(API.materialRequisitions().getMaterialRequisition(1, 'id', session, 0, 10)).resolves.toBeDefined();
    });

    it("GetMaterialRequisitions should return a list of material requisitions successfully", () => {
        return expect(
            API.materialRequisitions().getMaterialRequisitions({assigned_to: 1}, session)
        ).resolves.toMatchObject({
            code: 200,
            data: {
                data: {
                    items: [{
                        id: 1,
                        materials: [{id: 1, qty: 2}],
                        requested_by: 1,
                        requested_by_user:{id:1}
                    }]
                }
            }
        });
    });
});

describe("Delete MaterialRequisition", () => {
    it("DeleteMaterialRequisition should delete a material requisition", () => {
        return expect(API.materialRequisitions().deleteMaterialRequisition('id', 1, session)).resolves.toMatchObject({
            code: 200,
            data: {
                data: {
                    message: "Material Requisition deleted successfully."
                }
            }
        })
    });
});