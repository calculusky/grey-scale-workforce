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


test('Update Assigned :Old and New', ()=> {
    expect(Utils.updateAssigned([{"id":1}], [{"id":1}, {id:1}])).toEqual('[{"id":1}]');
});
