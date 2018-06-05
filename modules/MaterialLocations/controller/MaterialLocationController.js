/**
 * Created by paulex on 6/02/18.
 */


/**
 *
 * @param app
 * @param API {API}
 * @param jsonParser
 * @param urlencodedParser
 */
module.exports.controller = function (app, {API, jsonParser, urlencodedParser}) {
    app.use('/material_locations*', (req, res, next) => API.recognitions().auth(req, res, next));

    /**
     * @swagger
     * /material_locations:
     *   post:
     *     summary: Creates an MaterialLocation
     *     description: ''
     *     tags: [MaterialLocations]
     *     consumes:
     *     - application/json
     *     produces:
     *     - application/json
     *     operationId: createMaterialLocation
     *     responses:
     *       '200':
     *         description: Successfully Added
     *     parameters:
     *      - $ref: '#/parameters/sessionId'
     *      - in: body
     *        name: 'material_location'
     *        required: true
     *        schema:
     *          $ref: '#/definitions/postMaterialLocationInput'
     */
    app.post('/material_locations', jsonParser, (req, res) => {
        console.log(req.body);
        API.materialLocations().createMaterialLocation(req.body, req.who)
            .then(({data, code}) => {
                console.log(data);
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                console.log(code, err);
                return res.status(code).send(err);
            });
    });

    /**
     * @swagger
     * /material_locations:
     *   patch:
     *     summary: Update/Creates MaterialLocation in bulk
     *     description: ''
     *     tags: [MaterialLocations]
     *     consumes:
     *     - application/json
     *     produces:
     *     - application/json
     *     operationId: createMultipleMaterialLocation
     *     responses:
     *       '200':
     *         description: Successfully Added
     *     parameters:
     *      - $ref: '#/parameters/sessionId'
     *      - in: body
     *        name: 'material_location'
     *        required: true
     *        schema:
     *          $ref: '#/definitions/postMaterialLocationInput'
     */
    app.patch('/material_locations', jsonParser, (req, res) => {
        console.log(req.body);
        API.materialLocations().createMultipleMaterialLocation(req.body, req.who, API)
            .then(({data, code}) => {
                console.log(data);
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                console.log(code, err);
                return res.status(code).send(err);
            });
    });

    /**
     * @swagger
     * /material_locations:
     *   put:
     *     summary: Updates a MaterialLocation
     *     description: ''
     *     tags: [MaterialLocations]
     *     consumes:
     *     - application/json
     *     produces:
     *     - application/json
     *     operationId: updateMaterialLocation
     *     responses:
     *       '200':
     *         description: Successfully Added
     *     parameters:
     *      - $ref: '#/parameters/sessionId'
     *      - in: body
     *        name: 'material_location'
     *        required: true
     *        schema:
     *          $ref: '#/definitions/postMaterialLocationInput'
     */
    app.put('/material_locations', jsonParser, (req, res) => {
        API.materialLocations().updateMaterialLocation(req.body, req.who)
            .then(({data, code}) => {
                console.log(data);
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                console.log(code, err);
                return res.status(code).send(err);
            });
    });


    /**
     * @swagger
     * /material_locations/user/{user_id}/{offset}/{limit}:
     *   get:
     *     summary: Gets material_locations assigned to a user
     *     description: ''
     *     tags: [MaterialLocations]
     *     produces:
     *     - application/json
     *     operationId: getMaterialLocationsByUser
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getMaterialLocationOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - $ref: '#/parameters/user_id'
     *     - $ref: '#/parameters/offset'
     *     - $ref: '#/parameters/limit'
     */
    app.get('/material_locations/user/:user_id/:offset?/:limit?', urlencodedParser, (req, res) => {
        return API.materialLocations().getMaterialLocations(req.params['user_id'], "assigned_to", req.who, req.params.offset, req.params.limit)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });


    /**
     * @swagger
     * /material_locations/{offset}/{limit}:
     *   get:
     *     summary: Retrieves a List of material_locations
     *     description: ''
     *     tags: [MaterialLocations]
     *     produces:
     *     - application/json
     *     operationId: getMaterialLocations
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getMaterialLocationOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - $ref: '#/parameters/offset'
     *     - $ref: '#/parameters/limit'
     */
    app.get('/material_locations/:offset(\\d+)?/:limit(\\d+)?', urlencodedParser, (req, res) => {
        console.log('/material_locations/offset/limit');
        return API.materialLocations().getMaterialLocations({}, undefined, req.who, req.params.offset || 0, req.params.limit || 10)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });


    /**
     * @swagger
     * /material_locations/{id}:
     *   get:
     *     summary: Retrieves a Single MaterialLocation
     *     description: ''
     *     tags: [MaterialLocations]
     *     produces:
     *     - application/json
     *     operationId: getMaterialLocation
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getMaterialLocationOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - $ref: '#/parameters/material_location_id'
     */
    app.get('/material_locations/:id', urlencodedParser, (req, res) => {
        return API.materialLocations().getMaterialLocations(req.params['id'], undefined, req.who)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });

    /**
     * @swagger
     * /material_locations/search/{keyword}/{offset}/{limit}:
     *   get:
     *     summary: Search for a material_location either by the MaterialLocation Name or by an MaterialLocation Type
     *     description: ''
     *     tags: [MaterialLocations]
     *     produces:
     *     - application/json
     *     operationId: searchMaterialLocations
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getCustomerOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - $ref: '#/parameters/keyword'
     *     - $ref: '#/parameters/offset'
     *     - $ref: '#/parameters/limit'
     */
    app.get('/material_locations/search/:keyword/:offset(\\d+)?/:limit(\\d+)?', urlencodedParser, (req, res) => {
        console.log('/material_locations/search/keyword');
        return API.materialLocations().searchMaterialLocations(req.params['keyword'])
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });

    /**
     * @swagger
     * /material_locations/{id}:
     *  delete:
     *    summary: Deletes a MaterialLocation
     *    description: "Deletes a MaterialLocation"
     *    tags: [MaterialLocations]
     *    produces:
     *    - application/json
     *    operationId: deleteMaterialLocation
     *    responses:
     *      '200':
     *        description: Returns true with the id of the request deleted
     *    parameters:
     *    - $ref: '#/parameters/sessionId'
     *    - $ref: '#/parameters/material_location_id'
     */
    app.delete('/material_locations/:id', urlencodedParser, (req, res) => {
        API.materialLocations().deleteMaterialLocation("id", req.params.id)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });
};