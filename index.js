/**
 * Created by paulex on 7/1/17.
 */
require('dotenv').config();
const Context = require('./core/Context.js');
const ctx = new Context(require('./config.json'));
const API = require("./boostrap")(ctx);


//For test purpose only
if (process.env.NODE_ENV === "test") exports.test = () => API;