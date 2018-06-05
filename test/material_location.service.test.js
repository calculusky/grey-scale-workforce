/**
 * Created by paulex on 6/02/18.
 */

require('dotenv').config();
let API = require('../API');

const config = require('../config.json');
const Context = require('../core/Context');
API = new API(new Context(config));


it("Should fail when you try to create a material location with empty data", () => {
    return expect(API.materialLocations().createMaterialLocation({}, {}, API)).rejects.toBeDefined();
});


it("Creation of material locations should pass", () => {
    return expect(API.materialLocations().createMaterialLocation({
        "material_id": 3,
        "group_id": 1,
        "quantity": 58
    }, {}, API)).resolves.toEqual(expect.objectContaining({code: 200}));
});


it("Multiple creation/updating of material locations should pass", () => {
    return expect(API.materialLocations().createMultipleMaterialLocation([
        {
            "material_id": 3,
            "group_id": 1,
            "quantity": 58
        }
    ], {}, API)).resolves.toEqual(expect.objectContaining({code: 200}));
});