/**
 * Created by paulex on 6/02/18.
 */

const API = require('../index').test();


it("Should fail when passed empty data", () => {
    return expect(API.materialUtilizations().createMaterialUtilization({}, {})).rejects.toBeDefined();
});


test("That materialUtilization is created", () => {
    return expect(API.materialUtilizations().createMaterialUtilization({
        material_id: 20,
        work_order_id: 6,
        quantity: 10,
        description: "TEst the material utilization"
    }, {sub: 1})).resolves.toBeDefined();
});


test("That multiple materialUtilization can be created", () => {
    return expect(API.materialUtilizations().createMultipleMaterialUtilization([
        {
            material_id: 20,
            work_order_id: 6,
            quantity: 10,
            description: "TEst the material utilization"
        },
        {
            material_id: 16,
            work_order_id: 6,
            quantity: 59,
            description: "Ogo Email!!!!"
        }
    ], {sub: 1})).resolves.toEqual({});
});

test("Get material utilization by id", () => {
    return expect(API.materialUtilizations().getMaterialUtilization(1, 'id', {}, 0, 10)).resolves.toEqual({});
});


test("That we can filter material utilizations", () => {
    return expect(API.materialUtilizations().getMaterialUtilizations({
        assigned_to: 1
    }, {})).resolves.toEqual({});
});