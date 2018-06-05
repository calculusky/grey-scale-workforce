/**
 * Created by paulex on 6/02/18.
 */

require('dotenv').config();
let API = require('../API');

const config = require('../config.json');
const Context = require('../core/Context');
API = new API(new Context(config));


it("Should fail when you try to create a material with empty data", () => {
    return expect(API.materials().createMaterial({}, {})).rejects.toEqual({});
});