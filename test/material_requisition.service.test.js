/**
 * Created by paulex on 6/02/18.
 */

require('dotenv').config();
let API = require('../API');

const config = require('../config.json');
const Context = require('../core/Context');
API = new API(new Context(config));


it("Should fail when passed empty data", () => {
    return expect(API.materialRequisition().createMaterialRequisition({}, {})).rejects.toBeDefined();
});


test("That materialRequisition is created", () => {
    return expect(API.materialRequisition().createMaterialRequisition({
        materials: {"1": 20},
        requested_by: 1,
        status: 1
    }, {})).resolves.toBeDefined();
});