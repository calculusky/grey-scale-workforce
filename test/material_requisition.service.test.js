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
    const request = require('request');
    beforeAll(async () => {
        request.get = jest.fn((url, opt, callback) => {
            let body = {};
            if (url.indexOf(`/itemtypes`) !== -1) {
                body = {
                    "data": {
                        "xmlns": "ie_legend",
                        "entry": [
                            {
                                "id": 11,
                                "code": 11,
                                "name": "FUSE",
                                "category_code": 24
                            },
                            {
                                "id": 12,
                                "code": 12,
                                "name": "TYRE",
                                "category_code": 10
                            }
                        ]
                    }
                };
            }
            else if (url.indexOf('/items?itemtype_code') !== -1) {
                body = {
                    "data": {
                        "xmlns": "ie_legend",
                        "entry": [
                            {
                                "id": 230,
                                "code": "INV/230",
                                "description": "5KVA UPS",
                                "weight": 1200,
                                "itemtype_code": 11,
                                "min_qty": 1,
                                "weight_avg_cost": 1200,
                                "min_amt_limit": 200,
                                "max_amt_limit": 10000000,
                                "category_code": 28
                            },
                            {
                                "id": 231,
                                "code": "INV/231",
                                "description": "CASIO XJ A147 PROJECTOR",
                                "weight": 1200,
                                "itemtype_code": 11,
                                "min_qty": 1,
                                "weight_avg_cost": 1200,
                                "min_amt_limit": 200,
                                "max_amt_limit": 10000000,
                                "category_code": 28
                            }
                        ]
                    }
                };
            }
            callback(null, {}, body);
        });
        request.post = jest.fn((url, opt, callback) => {
            let body = {};
            callback(null, {statusCode: 200}, body);
        });
        tracker.on('query', query => {
            if (query.method === 'insert') {
                return query.response([1, {
                    fieldCount: 0,
                    affectedRows: 1
                }])
            }
        });
        const LegendService = require('../processes/LegendService');
        await LegendService.init(ctx);
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

    it("That materialRequisition is created", async () => {
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

    it("That materialRequisition is created on legend for materials sourced from legend", async () => {
        const body = {
            materials: [{"id": "20", "qty": "10", category: {id: 11, source: "ie_legend"}}],
            requested_by: 1,
            status: 1
        };
        return expect(API.materialRequisitions().createMaterialRequisition(body, session)).resolves.toMatchObject({
            code: 200,
            data: {
                data: body
            }
        });
    })

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
    const request = require('request');
    beforeAll(() => {
        request.get = jest.fn((url, opt, callback) => {
            let body = {};
            if (url.indexOf(`/itemtypes`) !== -1) {
                body = {
                    "data": {
                        "xmlns": "ie_legend",
                        "entry": [
                            {
                                "id": 11,
                                "code": 11,
                                "name": "FUSE",
                                "category_code": 24
                            },
                            {
                                "id": 12,
                                "code": 12,
                                "name": "TYRE",
                                "category_code": 10
                            }
                        ]
                    }
                };
            } else if (url.indexOf('/items?itemtype_code') !== -1) {
                body = {
                    "data": {
                        "xmlns": "ie_legend",
                        "entry": [
                            {
                                "id": 230,
                                "code": "INV/230",
                                "description": "5KVA UPS",
                                "weight": 1200,
                                "itemtype_code": 11,
                                "min_qty": 1,
                                "weight_avg_cost": 1200,
                                "min_amt_limit": 200,
                                "max_amt_limit": 10000000,
                                "category_code": 28
                            },
                            {
                                "id": 231,
                                "code": "INV/231",
                                "description": "CASIO XJ A147 PROJECTOR",
                                "weight": 1200,
                                "itemtype_code": 11,
                                "min_qty": 1,
                                "weight_avg_cost": 1200,
                                "min_amt_limit": 200,
                                "max_amt_limit": 10000000,
                                "category_code": 28
                            }
                        ]
                    }
                };
            }
            callback(null, {}, body);
        });
        tracker.on('query', query => {
            if (query.sql.indexOf('from `material_requisitions`') !== -1) {
                return query.response([{
                    id: 2,
                    materials: [{id: 2, qty: 4}],
                    requested_by: 1
                },
                    {
                        id: 3,
                        materials: [{id: 1, qty: 55, source: "ie_legend", source_id: "INV/230", category_id: 11}],
                        requested_by: 1
                    }
                ]);
            }
            else if (query.sql.indexOf('from `materials`') !== -1) {
                return query.response([
                    {
                        id: 1,
                        name: "Material One"
                    },
                    {
                        id: 2,
                        name: "Material Two"
                    }
                ])
            } else if (query.sql.indexOf('from `users`') !== -1) {
                return query.response([{id: 1}]);
            }
            else {
                return query.response([]);
            }
        });
    });

    it("GetMaterialRequisition should be defined", async () => {
        const LegendService = require('../processes/LegendService');
        await LegendService.init(ctx);
        return expect(API.materialRequisitions().getMaterialRequisition(1, 'id', session, 0, 10)).resolves.toBeDefined();
    });

    it("GetMaterialRequisitions should return a list of material requisitions successfully", async () => {
        const LegendService = require('../processes/LegendService');
        await LegendService.init(ctx);
        return expect(
            API.materialRequisitions().getMaterialRequisitions({assigned_to: 1}, session)
        ).resolves.toMatchObject({
            code: 200,
            data: {
                data: {
                    items: [{
                        id: 2,
                        materials: [{
                            "id": 2,
                            "name": "Material Two",
                            "qty": 4
                        }],
                        requested_by: 1,
                        requested_by_user: {id: 1}
                    },
                        {
                            id: 3,
                            materials: [{
                                "category": {
                                    "id": 11,
                                    "name": "FUSE"
                                },
                                "category_id": 11,
                                "description": "5KVA UPS",
                                "id": 230,
                                "name": "INV/230",
                                "qty": 55,
                                "source": "ie_legend",
                                "source_id": "INV/230",
                                "status": undefined
                            }],
                            requested_by: 1,
                            requested_by_user: {id: 1}
                        }
                    ]
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