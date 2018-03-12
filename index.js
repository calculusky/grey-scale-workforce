/**
 * Created by paulex on 7/1/17.
 */
const Context = require('./core/Context.js');
const ctx = new Context(require('./config.json'));
require("./boostrap")(ctx);