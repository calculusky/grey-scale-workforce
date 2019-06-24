/**
 * @type {API}
 */
let [API, ctx] = require('../index').test();
const globalMock = require('./setup/ApplicationDependency');
const LegendService = require('../processes/LegendService');
const request = require('request');
/**
 * @param session {Session}
 */
let knexMock, tracker, session;

beforeAll(async (done) => {
    [knexMock, tracker, session] = await globalMock.applicationBeforeAll(ctx);
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
        else if (url.indexOf('/requests?fault_id') !== -1) {
            body = {
                "data": [
                    {
                        "FAULT_ID": "F001",
                        "Approvalstatus": "PENDING",
                        "TRANS_DATE": "2019-06-10 00:00:00.0",
                        "Collector": "Engr (Mrs) Gufrah Shuaib",
                        "Quantity": "0",
                        "REMARKS": "Testing from IForce",
                        "RequestedBY": "TEST USER",
                        "Approval": "admin"
                    },
                    {
                        "FAULT_ID": "F001",
                        "Approvalstatus": "PENDING",
                        "TRANS_DATE": "2019-06-10 00:00:00.0",
                        "Collector": "Engr (Mrs) Hope Gabriel",
                        "Quantity": "0",
                        "REMARKS": "Testing from IForce",
                        "RequestedBY": "TEST USER",
                        "Approval": "admin"
                    }
                ]
            };
        }
        callback(null, {}, body);
    });
    done();
});

afterAll(async done => {
    await ctx.getPersistence().disconnect();
    knexMock.unmock(ctx.db(), 'knex@0.15.2');
    done();
});

describe("Initializing LegendService", () => {
    it("Initializing Legend Service with context should throw error", () => {
        return expect(LegendService.init()).rejects.toThrowError("context cannot be null");
    });

    it("Initializing Legend Service should run successfully", () => {
        return expect(LegendService.init(ctx)).resolves.toBeTruthy();
    });
});

describe("Retrieve items from legend", () => {
    beforeAll(async () => {
        await LegendService.init(ctx);
    });

    it("Get the item type codes", () => {
        return expect(LegendService.getItemTypeCodes()).toMatchObject({
            "11": {
                "category_code": 24,
                "code": 11,
                "id": 11,
                "name": "FUSE"
            }
        });
    });

    it("getItemsByItemCode: should return items list successfully", () => {
        return expect(LegendService.getMaterialsByItemCode(11)).resolves.toMatchObject(expect.any(Array))
    });

    it("getLegendItemCodeByMaterialCategory: should return the legend code for material_id", () => {
        return expect(LegendService.getItemCodeByMaterialCategoryId(1)).toEqual(11);
    });

});


describe("Request legend materials", () => {
    beforeAll(async () => {
        request.post = jest.fn((url, options, callback) => {
            return callback(null, {statusCode: 200}, {});
        });
        await LegendService.init(ctx);
    });
    it("requestMaterial: should throw error when the fault id is not defined", () => {
        return expect(function () {
            LegendService.requestMaterial();
        }).toThrowError("The Fault ID is required");
    });

    it("requestMaterial: should throw ", () => {
        return expect(LegendService.requestMaterial("F001", {}, {})).rejects.toThrowError();
    });

    it("requestMaterial: should create a material requisition", () => {
        const material = {
            id: 126,
            name: "INV/679",
            category: {
                id: 11,
                name: ""
            }
        };
        return expect(LegendService.requestMaterial("F001", material, {})).resolves.toBeDefined();
    });

    it("requestMaterial: should create multiple material requisition", () => {
        const materials = [{
            id: 126,
            name: "INV/679",
            category: {
                id: 11,
                name: ""
            }
        }];
        return expect(LegendService.requestMaterials("F001", materials, {})).resolves.toEqual([{}]);
    });

    it("checkMaterialRequestStatus: should check the status of a requisition", () => {
        return expect(LegendService.checkMaterialRequestStatus("F001")).resolves.toBeDefined();
    });
});