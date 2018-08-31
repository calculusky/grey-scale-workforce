/**
 * Created by paulex on 6/02/18.
 */

/**
 * @type {API}
 */
const API = require('../index').test();


it("Should fail when you try to create a material with empty data", () => {
    return expect(API.materials().createMaterial({}, {})).rejects.toEqual({});
});


test("Query for a list of materials", () => {
    return expect(API.materials().getMaterials({
        unit_price: "Metres"
    }, {})).resolves.toEqual(expect.objectContaining({
        code: expect.any(Number),
        data: expect.any(Object)
    }));
});