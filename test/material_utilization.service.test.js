/**
 * Created by paulex on 6/02/18.
 */

const [API, ctx] = require('../index').test();
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

describe("Material Utilization Creation", () => {

    beforeAll(() => {
        tracker.on('query', query => {
            if (query.method === 'insert') {
                return query.response([1, {
                    fieldCount: 0,
                    affectedRows: 1
                }]);
            }
        });
    });

    it("CreateMaterialUtilization should fail when mandatory fields are missing", () => {
        return expect(API.materialUtilizations().createMaterialUtilization({}, {})).rejects.toMatchObject({
            code: 400,
            err: {
                code: "VALIDATION_ERROR",
                data: {
                    material_id: ["The material id is required."],
                    work_order_id: ["The work order id is required."],
                    quantity: ["The quantity is required."],
                    description: ["The description is required."]
                }
            }
        });
    });


    it("That materialUtilization is created", () => {
        const body = {
            material_id: 20,
            work_order_id: 6,
            quantity: 10,
            description: "TEst the material utilization"
        };
        return expect(API.materialUtilizations().createMaterialUtilization(body, session)).resolves.toMatchObject({
            code: 200,
            data: {
                data: body
            }
        });
    });


    it("CreateMultipleMaterialUtilization should fail when body parameter isn't an array", () => {
        return expect(API.materialUtilizations().createMultipleMaterialUtilization({}, session, API)).rejects.toMatchObject({
            code: 400,
            err: {
                code: "VALIDATION_ERROR",
                data: {
                    body: ["request body must be an array of material utilizations."]
                }
            }
        })
    });

    it("CreateMultipleMaterialUtilization should fail when mandatory fields are missing in either item", () => {
        const utilizations = [{
            material_id: 20,
            work_order_id: 6,
            quantity: 10,
            description: "TEst the material utilization"
        }, {
            material_id: 20,
        }];
        return expect(API.materialUtilizations().createMultipleMaterialUtilization(utilizations, session, API)).rejects.toMatchObject({
            code: 400,
            err: {
                code: "VALIDATION_ERROR",
                data: {
                    "quantity": ["The quantity is required."]
                }
            }
        })
    });

});

describe("Retrieve MaterialUtilizations", () => {

    beforeAll(() => {
        tracker.on('query', query => {
            if (query.sql.indexOf('from `material_utilizations`') !== -1) {
                return query.response([{
                    id: 1,
                    work_order_id: 2,
                    material_id: 1,
                    quantity: 40,
                    description: "GAPS"
                }])
            } else if (query.sql.indexOf('from `materials`') !== -1) {
                return query.response([{
                    id: 1,
                    name: "Lines",
                    unit_price: 200.57
                }])
            }
        });
    });

    it("GetMaterialUtilization should return a list of material utilization", () => {
        return expect(API.materialUtilizations().getMaterialUtilization(1, 'id', session, 0, 10)).resolves.toMatchObject({
            code: 200,
            data: {
                data: {
                    items: [{
                        id: 1,
                        work_order_id: 2,
                        material_id: 1,
                        quantity: 40,
                        description: "GAPS",
                        material: {
                            id: 1,
                            name: "Lines",
                            unit_price: 200.57
                        }
                    }]
                }
            }
        });
    });

    it("GetMaterialUtilizations should return a list of material utilizations", () => {
        const query = {assigned_to: 1};
        return expect(API.materialUtilizations().getMaterialUtilizations(query, session)).resolves.toMatchObject({
            code: 200,
            data: {
                data: {
                    items: [{
                        id: 1,
                        work_order_id: 2,
                        material_id: 1,
                        quantity: 40,
                        description: "GAPS",
                        material: {
                            id: 1,
                            name: "Lines",
                            unit_price: 200.57
                        }
                    }]
                }
            }
        });
    });

});

describe("Update Material Utilizations", () => {
    beforeAll(() => {
        tracker.on('query', query => {
            if (query.sql.indexOf('from `material_utilizations`') !== -1) {
                return query.response([{
                    id: 1,
                    work_order_id: 2,
                    material_id: 1,
                    quantity: 40,
                    description: "GAPS"
                }])
            }
        });
    });

    it("UpdateMaterialUtilization should update a material utilization successfully", () => {
        const body = {material_id: 2};
        return expect(
            API.materialUtilizations().updateMaterialUtilization('id', 1, body, session, [], API)
        ).resolves.toMatchObject({
            code: 200,
            data: {
                data: body
            }
        })
    });

});
