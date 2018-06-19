/**
 * Created by paulex on 06/17/18.
 */


/**
 *
 * @param app
 * @param API {API}
 * @param jsonParser
 * @param urlencodedParser
 */
module.exports.controller = function (app, {API, jsonParser, urlencodedParser}) {
    app.use('/material_utilizations*', (req, res, next) => API.recognitions().auth(req, res, next));

    /**
     * @swagger
     * /material_utilizations:
     *   post:
     *     summary: Creates an MaterialUtilization
     *     description: ''
     *     tags: [MaterialUtilizations]
     *     consumes:
     *     - application/json
     *     produces:
     *     - application/json
     *     operationId: createMaterialUtilization
     *     responses:
     *       '200':
     *         description: Successfully Added
     *     parameters:
     *      - $ref: '#/parameters/sessionId'
     *      - in: body
     *        name: 'asset'
     *        required: true
     *        schema:
     *          $ref: '#/definitions/postMaterialUtilizationInput'
     */
    app.post('/material_utilizations', jsonParser, (req, res) => {
        console.log(req.body);
        API.materialUtilizations().createMaterialUtilization(req.body, req.who)
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
     * /material_utilizations:
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
     *        schema:
     *          $ref: '#/definitions/postMaterialLocationInput'
     */
    app.patch('/material_utilizations', jsonParser, (req, res) => {
        console.log(req.body);
        API.materialUtilizations().createMultipleMaterialUtilization(req.body, req.who, API)
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
     * /material_utilizations:
     *   put:
     *     summary: Updates a MaterialUtilization
     *     description: ''
     *     tags: [MaterialUtilizations]
     *     consumes:
     *     - application/json
     *     produces:
     *     - application/json
     *     operationId: updateMaterialUtilization
     *     responses:
     *       '200':
     *         description: Successfully Added
     *     parameters:
     *      - $ref: '#/parameters/sessionId'
     *      - in: body
     *        name: 'asset'
     *        required: true
     *        schema:
     *          $ref: '#/definitions/postMaterialUtilizationInput'
     */
    app.put('/material_utilizations', jsonParser, (req, res) => {
        API.materialUtilizations().updateMaterialUtilization(req.body, req.who)
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
     * /material_utilizations:
     *   get:
     *     summary: Retrieves a List of material_utilizations
     *     description: ''
     *     tags: [MaterialUtilizations]
     *     produces:
     *     - application/json
     *     operationId: getMaterialUtilizations
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getMaterialUtilizationOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - $ref: '#/parameters/offset'
     *     - $ref: '#/parameters/limit'
     */
    app.get('/material_utilizations', urlencodedParser, (req, res) => {
        return API.materialUtilizations().getMaterialUtilizations(req.query, req.who)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });


    /**
     * @swagger
     * /material_utilizations/{id}:
     *   get:
     *     summary: Retrieves a Single MaterialUtilization
     *     description: ''
     *     tags: [MaterialUtilizations]
     *     produces:
     *     - application/json
     *     operationId: getMaterialUtilization
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getMaterialUtilizationOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - $ref: '#/parameters/asset_id'
     */
    app.get('/material_utilizations/:id', urlencodedParser, (req, res) => {
        return API.materialUtilizations().getMaterialUtilization(req.params['id'], undefined, req.who)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });


    /**
     * @swagger
     * /material_utilizations/{id}:
     *  delete:
     *    summary: Deletes a MaterialUtilization
     *    description: "Deletes a MaterialUtilization"
     *    tags: [MaterialUtilizations]
     *    produces:
     *    - application/json
     *    operationId: deleteMaterialUtilization
     *    responses:
     *      '200':
     *        description: Returns true with the id of the request deleted
     *    parameters:
     *    - $ref: '#/parameters/sessionId'
     *    - $ref: '#/parameters/asset_id'
     */
    app.delete('/material_utilizations/:id', urlencodedParser, (req, res) => {
        API.materialUtilizations().deleteMaterialUtilization("id", req.params.id)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });
};