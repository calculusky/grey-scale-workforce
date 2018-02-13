/**
 * Created by paulex on 7/1/17.
 */
// const path = require("path");
const config = require('./config.json');
const Context = require('./core/Context.js');
const ctx = new Context(config);
const route = require("./route")(ctx);
//Start the schedulers
const cronJobs = require('./schedulers/main.js')(ctx);