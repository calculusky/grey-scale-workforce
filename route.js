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
const events = require('./events/events.js');
var cors = require('cors');

module.exports = function route(context) {

    //Initialize the API
    API = new API(context);

    /**
     * Configure Express
     * Configure SocketIO
     */
    var app = express();
    //initialize socket.io
    const http = require('http').Server(app);
    const io = require('socket.io')(http);

    events.init(context, io, API);

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
     * Configure the storage options
     * @type {string}
     */
    var controllerPath = './modules';
    var swaggerAPIs = ['./route*.js', './api.yml'];

    //configure multer for dynamic storage
    const storage = multer.diskStorage({
        destination: (req, file, cb)=> {
            let path = req.path.substring(1, req.path.length);
            path = (path.includes("/")) ? path.substr(0, path.indexOf('/')) : path;
            let parentPath = context.config.storage.path;
            let routePaths = context.config.storage['routeStorage'];
            let saveAt = parentPath;

            let routePath = routePaths[path];
            if (routePath) {
                saveAt = (routePath.use_parent) ? `${saveAt}${routePath.path}` : routePath.path;
            } else {
                if (path == "attachments") {
                    const body = req.body;
                    saveAt = `${saveAt}/attachments/${body.module}`
                } else if (path == 'uploads') {
                    console.log(req.body);
                    //for uploads the upload type is important
                    saveAt = `${saveAt}/uploads/${req.body['upload_type']}`;
                }
            }
            cb(null, saveAt);
        }
    });

    let multiPart = multer({storage: storage});
    /**
     * Add all Application Controller to the system
     * @type {string}
     */
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
     *
     *  - name: Users
     *    description: Users
     *
     *  - name: Customers
     *    description: Customers
     *
     *  - name: Assets
     *    description: Assets
     *
     *  - name: Faults
     *    description: Faults
     *
     *  - name: Meter Readings
     *    description: SpotBilling
     *
     *  - name: Work Orders
     *    description: Work Order/Disconnection Order etc.
     *
     *  - name: Payments
     *    description: Payments
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
            title: "IForce API.",
            version: "1.0",
            description: "IForce API Documentation",
            "x-ibm-name": "mr.working-api"
        },
        schemes: ['http']
    });

    //Register Plugins
    app.use(express.static('public'));

    http.listen(9003, ()=>console.log("Started MrWorking API"));
};