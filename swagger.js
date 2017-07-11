/**
 * Created by paulex on 7/2/17.
 */

module.exports = new Swagger();


function Swagger() {
}

Swagger.prototype.config = function (app, config) {
    // function config(app, routePath){
    const swaggerDoc = require("swagger-jsdoc");
    const path = require("path");
    app.use('/swagger', config['express'].static(path.join(__dirname, config['swaggerUI']), {
        etag: false
    }));
    var swaggerDefinition = {
        info: config.info || { // API informations (required)
            title: 'Hello World', // Title (required)
            version: '1.0.0', // Version (required)
            description: 'A sample API' // Description (optional)
        },
        host: config.host, // Host (optional)
        basePath: '/' // Base path (optional)
    };


    var options = {
        // Import swaggerDefinitions
        swaggerDefinition: swaggerDefinition,
        // Path to the API docs
        apis: config.apis
    };

    var swaggerSpec = swaggerDoc(options);


    app.get('/api-docs.json', function (req, res) {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });

    console.log(`Access Swagger API at : ${config.host}/swagger`);
    console.log(`Swagger Json file can be accessed at : ${config.host}/api-docs.json`);
};