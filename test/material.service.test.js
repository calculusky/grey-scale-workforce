/**
 * Created by paulex on 6/02/18.
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

describe("Materials Creation", () => {

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

    it("CreateMaterial Should fail when mandatory fields are missing", () => {
        return expect(API.materials().createMaterial({}, session)).rejects.toMatchObject({
            code: 400,
            err: {
                data: {
                    name: ["The name is required."],
                    unit_of_measurement: ["The unit of measurement is required."]
                }
            }
        });
    });

    it("CreateMaterial should pass when mandatory fields are specified", () => {
        const body = {name: "Copper Wire", unit_of_measurement: "CM"};
        return expect(API.materials().createMaterial(body, session)).resolves.toMatchObject({
            code: 200,
            data: {
                data: body
            }
        });
    });
});

describe("Material Update and Search", () => {

    beforeAll(() => {
        tracker.on('query', query => {
            if (query.sql.indexOf('from `materials`')) {
                return query.response([{
                    id: 1,
                    name: "Simulation"
                }]);
            }
        });
    });

    it("UpdateMaterial should pass successfully", () => {
        const material = {name: 'Simulation'};
        return expect(API.materials().updateMaterial('id', 1, material, session)).resolves.toMatchObject({
            code: 200,
            data: {
                data: {
                    id: 1,
                    name: "Simulation"
                }
            }
        });
    });

    it("SearchMaterial should pass and return material items", () => {
        return expect(API.materials().searchMaterials("test")).resolves.toMatchObject({
            code: 200,
            data: {
                data: {
                    items: [
                        {id: 1, name: "Simulation"}
                    ]
                }
            }
        });
    });

});

describe("Retrieve List of Materials", () => {
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
                                "itemtype_code": 20,
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
                                "itemtype_code": 20,
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
            if (query.sql.indexOf('from `materials`')) {
                return query.response([{
                    id: 1,
                    name: "Simulation",
                    unit_price: 23.19
                }]);
            }
        })
    });

    it("GetMaterials should get a list of materials", () => {
        return expect(API.materials().getMaterials({unit_price: 23.19}, {})).resolves.toMatchObject({
            code: 200,
            data: {
                data: {
                    items: [{
                        id: 1,
                        name: "Simulation",
                        unit_price: 23.19
                    }],
                }
            }
        });
    });

    it("GetMaterials should get a list of materials by category", async () => {
        const LegendService = require('../processes/LegendService');
        await LegendService.init(ctx);
        return expect(API.materials().getMaterials({category_id: 1}, session)).resolves.toMatchObject({
            code: 200,
            data: {
                data: {
                    items: [
                        {
                            "business_unit": null,
                            "group": {},
                            "id": 1,
                            category: null,
                            "name": "Simulation",
                            "undertaking": null,
                            "unit_price": 23.19
                        },
                        {
                            category_id:11,
                            "category": {
                                "id": 11,
                                "name": "FUSE"
                            },
                            "id": 230,
                            "name": "INV/230",
                            "description": "5KVA UPS",
                            "source": "ie_legend",
                            "source_id": "INV/230"
                        },
                        {
                            category_id:11,
                            "category": {
                                "id": 11,
                                "name": "FUSE"
                            },
                            "id": 231,
                            "name": "INV/231",
                            "description": "CASIO XJ A147 PROJECTOR",
                            "source": "ie_legend",
                            "source_id": "INV/231"
                        }],
                }
            }
        });
    });

});


it("DeleteMaterials delete material successfully.", () => {
    return expect(API.materials().deleteMaterial('id', 1, session)).resolves.toMatchObject({
        code: 200,
        data: {
            data: {
                message: "Material successfully deleted."
            }
        }
    });
});