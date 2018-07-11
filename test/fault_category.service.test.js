/**
 * Created by paulex on 9/6/17.
 */
require('dotenv').config();
let API = require('../API');

const config = require('../config.json');
const Context = require('../core/Context');
const ctx = new Context(config);
API = new API(ctx);

// const Utils = require('../core/Utility/Utils');


test('Testlar', () => {
    API.faultCategories().getFaultCategories({type: "LT FAULT"}).then(d => {
        expect(d).toEqual({});
    });
});
