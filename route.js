/**
 * Created by paulex on 7/2/17.
 */
const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({extended: false});
const jsonParser = bodyParser.json();
const API = require('./API.js');
const fs = require('fs');
const swagger = require('./swagger');
const express = require("express");
var cors = require('cors');

module.exports = function route() {

    /**
     * Configure Express
     */
    var app = express();
    app.set('port', process.env.PORT || 3000);
    app.options('*', cors());
    // app.use('/*',function (req, res, next) {
    //     res.header('Access-Control-Allow-Origin', '*');
    //     // res.header('Access-Control-Allow-Credentials', "true");
    //     res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    //     res.header('Access-Control-Allow-Headers', 'apim-debug, x-travels-token, Content-Type, Accept, Origin');
    //     res.header('Access-Control-Expose-Headers', "true");
    //     next();
    // });


    /**
     * Add all Application Controller to the system
     * @type {string}
     */
    var controllerPath = './modules';
    var swaggerAPIs = ['./route*.js', './api.yml'];
    fs.readdirSync(controllerPath).forEach(dir=> {
        if(fs.statSync(`${controllerPath}/${dir}`).isDirectory()){
            var filePath = `${controllerPath}/${dir}/controller`;
            fs.readdirSync(filePath).forEach(controller=> {
                if(controller) {
                    var routeCtrl = require(`${filePath}/${controller}`);
                    swaggerAPIs.push(`${filePath}/${controller}`);
                    routeCtrl.controller(app, {API, jsonParser, urlencodedParser});
                }
            });
        }
    });


    /**
     * @swagger
     * tags:
     *  - name: Travel Request
     *    description: Travel Requests
     *
     *  - name: User
     *    description: Users
     *
     */

    /**
     * Swagger API configuration
     */
    swagger.config(app, {
        express: express,
        host: "localhost:9003",
        swaggerUI: "swagger-ui/dist",
        apis: swaggerAPIs,
        info: {
            title: "NCDMB Travels API.",
            version: "1.0",
            description: "Travels Documentation"
        }
    });

    app.listen(9003, ()=>console.log("Started Travels API"));
};