/**
 * Created by paulex on 7/1/17.
 */
const express = require("express");
const path = require("path");
const route = require("./route");
const swagger = require('./swagger');

var app = express();

// app.use(bodyParser);
app.set('port', process.env.PORT || 3000);

app.all('/*', function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

swagger.config(app, {
    express:express,
    host:"localhost:9003",
    swaggerUI:"swagger-ui/dist",
    apis:['./route*.js','./api.yml'],
    info:{
        title:"NCDMB Travels API.",
        version:"1.0",
        description:"Travels Documentation"
    }
});

route(app);

app.listen(9003, ()=>console.log("Started Travels API"));