/**
 * Created by paulex on 7/1/17.
 */
const path = require("path");
const config = require('./config.json');
const Context = require('./core/Context.js');
const route = require("./route")(new Context(config));