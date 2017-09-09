/**
 * Created by paulex on 7/2/17.
 */
const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({extended: false, limit: '5mb'});
const jsonParser = bodyParser.json();
const multer = require('multer');
var API = require('./API.js');
const fs = require('fs');
const swagger = require('./swagger');
const express = require("express");
var cors = require('cors');

module.exports = function route(context) {

    //Initialize the API
    API = new API(context);

    /**
     * Configure Express
     */
    var app = express();
    app.set('port', process.env.PORT || 3000);
    // app.use(cors());
    app.use(function (req, res, next) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Credentials', "true");
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, apim-debug, x-working-token, Content-Type, Accept');
        res.header('Access-Control-Expose-Headers', "true");

        if (req.method == 'OPTIONS'
            || req.header('access-control-request-Headers')
            || req.header('access-control-request-Method')) {
            return res.sendStatus(200);
        } else {
            return next();
        }
    });

    app.use(jsonParser);
    app.use(function (error, req, res, next) {
        if (error instanceof SyntaxError) {
            return res.status(400).send({
                status: 'fail',
                message: 'Invalid body payload format',
                description: "Ensure that the data payload sent is in correct format"
            });
        } else {
            next();
        }
    });


    /**
     * Add all Application Controller to the system
     * @type {string}
     */
    var controllerPath = './modules';
    var swaggerAPIs = ['./route*.js', './api.yml'];

    //configure multer storage

    const storage = multer.diskStorage({
        destination:(req, file, cb)=>{
            cb(null, context.storage.path);
        }
    });

    let multiPart = multer({storage: storage});
    fs.readdirSync(controllerPath).forEach(dir=> {
        if (fs.statSync(`${controllerPath}/${dir}`).isDirectory()) {
            var filePath = `${controllerPath}/${dir}/controller`;
            if (fs.existsSync(filePath)) {
                fs.readdirSync(filePath).forEach(controller=> {
                    if (controller) {
                        var routeCtrl = require(`${filePath}/${controller}`);
                        swaggerAPIs.push(`${filePath}/${controller}`);
                        routeCtrl.controller(app, {API, jsonParser, urlencodedParser, multiPart});
                    }
                });
            }
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
     *  - name: Staff
     *    description: Staffs
     *
     *  - name: Departments
     *    description: Departments
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
            title: "Mr.Working API.",
            version: "1.0",
            description: "Mr.Working Documentation",
            "x-ibm-name": "mr.working-api"
        },
        schemes: ['http']
    });

    app.listen(9003, ()=>console.log("Started MrWorking API"));
};