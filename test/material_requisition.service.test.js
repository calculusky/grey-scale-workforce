/**
 * Created by paulex on 6/02/18.
 */

/**
 * @type API {API}
 */
let API = require('../index').test();


it("Should fail when passed empty data", () => {
    return expect(API.materialRequisitions().createMaterialRequisition({}, {})).rejects.toEqual(expect.objectContaining({
        code: 400,
        err: expect.objectContaining({
            code: "VALIDATION_ERROR"
        })
    }));
});

test("That materialRequisition is created", () => {
    return expect(API.materialRequisitions().createMaterialRequisition({
        materials: '[{"id": "20","qty":"10"}]',
        requested_by: 1,
        status: 1
    }, {})).resolves.toEqual(expect.objectContaining({
        "code": 200,
        data: expect.any(Object)
    }));
});

test("Get material requisitions by id", () => {
    return expect(API.materialRequisitions().getMaterialRequisition(1, 'id', {}, 0, 10)).resolves.toBeDefined();
});

test("That we can filter material requisitions", () => {
    return expect(API.materialRequisitions().getMaterialRequisitions({
        assigned_to: 1
    }, {})).resolves.toBeDefined();
});

afterAll(i=>{
    API.materialRequisitions().deleteMaterialRequisition();
});