/**
 * Created by paulex on 6/02/18.
 */

const API = require('../index').test();


it("Should fail when you try to create a material with empty data", () => {
    return expect(API.materials().createMaterial({}, {})).rejects.toEqual({});
});