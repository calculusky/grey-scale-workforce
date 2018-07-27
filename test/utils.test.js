/**
 * Created by paulex on 9/6/17.
 */
require('dotenv').config();
// let API = require('../API');

// const config = require('../config.json');
// const Context = require('../core/Context');
// const ctx = new Context(config);
// API = new API(ctx);

const Utils = require('../core/Utility/Utils');


test('Update Assigned :Old and New', () => {
    expect(Utils.updateAssigned([{"id": 1}], [{"id": 1}, {id: 1}])).toEqual('[{"id":1}]');
});


it("isJson with empty string", () => {
  expect(Utils.isJson("")[0]).toEqual(false);
});

it("isJson with bad json format", () => {
    expect(Utils.isJson()[0]).toEqual(false);
});

it("isJson with a valid", () => {
    expect(Utils.isJson("[\"holyspirit\",\"broken\",\"mobile\"]")[0]).toEqual(true);
});

it("isJson with a valid", () => {
    expect(Utils.isJson(["abc"])[0]).toEqual(true);
});
