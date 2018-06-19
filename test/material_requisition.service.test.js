/**
 * Created by paulex on 6/02/18.
 */

require('dotenv').config();
let API = require('../API');

const config = require('../config.json');
const Context = require('../core/Context');
API = new API(new Context(config));


it("Should fail when passed empty data", () => {
    return expect(API.materialRequisitions().createMaterialRequisition({}, {})).rejects.toBeDefined();
});

test("That materialRequisition is created", () => {
    return expect(API.materialRequisitions().createMaterialRequisition({
        materials: '[{"id": "20","qty":"10"}]',
        requested_by: 1,
        status: 1
    }, {})).resolves.toBeDefined();
});

test("Get material requisitions by id", () => {
    return expect(API.materialRequisitions().getMaterialRequisition(1, 'id', {}, 0, 10)).resolves.toBeDefined();
});

test("That we can filter material requisitions", () => {
    return expect(API.materialRequisitions().getMaterialRequisitions({
        assigned_to: 1
    }, {})).resolves.toBeDefined();
});