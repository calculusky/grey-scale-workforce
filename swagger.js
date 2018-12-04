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
    app.use('/api', config['express'].static(path.join(__dirname, config['swaggerUI']), {
        etag: false
    }));
    const swaggerDefinition = {
        info: config.info || { // API informations (required)
            title: 'Mr.Working API', // Title (required)
            version: '1.0.0', // Version (required)
            description: 'A Mr.Working API', // Description (optional)
            "x-ibm-name": "mr.working-api"
        },
        host: config.host.replace("http://", ""), // Host (optional)
        basePath: '/' // Base path (optional)
    };


    const options = {
        // Import swaggerDefinitions
        swaggerDefinition: swaggerDefinition,
        // Path to the API docs
        apis: config.apis
    };

    const swaggerSpec = swaggerDoc(options);


    app.get('/api-docs.json', function (req, res) {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });

    if (process.env.NODE_ENV !== "test") {
        console.log(`Access Swagger API at : ${config.host}/api`);
        console.log(`Swagger Json file can be accessed at : ${config.host}/api-docs.json`);
    }
};