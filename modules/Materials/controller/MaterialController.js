/**
 * Created by paulex on 06/02/18.
 */


/**
 *
 * @param app
 * @param API {API}
 * @param jsonParser
 * @param urlencodedParser
 */
module.exports.controller = function (app, {API, jsonParser, urlencodedParser}) {
    app.use('/materials*', (req, res, next) => API.recognitions().auth(req, res, next));

    /**
     * @swagger
     * /materials:
     *   post:
     *     summary: Creates a Material
     *     description: ''
     *     tags: [Materials]
     *     consumes:
     *     - application/json
     *     produces:
     *     - application/json
     *     operationId: createMaterial
     *     responses:
     *       '200':
     *         description: Successfully Added
     *     parameters:
     *      - $ref: '#/parameters/sessionId'
     *      - in: body
     *        name: 'material'
     *        required: true
     *        schema:
     *          $ref: '#/definitions/postMaterialInput'
     */
    app.post('/materials', jsonParser, (req, res) => {
        console.log(req.body);
        API.materials().createMaterial(req.body, req.who)
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
     * /materials:
     *   put:
     *     summary: Updates a Material
     *     description: ''
     *     tags: [Materials]
     *     consumes:
     *     - application/json
     *     produces:
     *     - application/json
     *     operationId: updateMaterial
     *     responses:
     *       '200':
     *         description: Successfully Added
     *     parameters:
     *      - $ref: '#/parameters/sessionId'
     *      - in: body
     *        name: 'material'
     *        required: true
     *        schema:
     *          $ref: '#/definitions/postMaterialInput'
     */
    app.put('/materials', jsonParser, (req, res) => {
        API.materials().updateMaterial(req.body, req.who)
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
     * /materials:
     *   get:
     *     summary: Retrieves a List of materials
     *     description: ''
     *     tags: [Materials]
     *     produces:
     *     - application/json
     *     operationId: getMaterial
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getMaterialOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - $ref: '#/parameters/offset'
     *     - $ref: '#/parameters/limit'
     */
    app.get('/materials', urlencodedParser, (req, res) => {
        console.log('/materials');
        return API.materials().getMaterials(req.query, req.who)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });

    /**
     * @swagger
     * /materials/{id}:
     *   get:
     *     summary: Retrieves a Single Material
     *     description: ''
     *     tags: [Materials]
     *     produces:
     *     - application/json
     *     operationId: getMaterial
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getMaterialOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - $ref: '#/parameters/material_id'
     */
    app.get('/materials/:id', urlencodedParser, (req, res) => {
        return API.materials().getMaterial(req.params['id'], undefined, req.who)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });

    /**
     * @swagger
     * /materials/search/{keyword}/{offset}/{limit}:
     *   get:
     *     summary: Search for a material either by the Material Name or by an Material Type
     *     description: ''
     *     tags: [Materials]
     *     produces:
     *     - application/json
     *     operationId: searchMaterials
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
    app.get('/materials/search/:keyword/:offset(\\d+)?/:limit(\\d+)?', urlencodedParser, (req, res) => {
        console.log('/materials/search/keyword');
        return API.materials().searchMaterials(req.params['keyword'])
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });

    /**
     * @swagger
     * /materials/{id}:
     *  delete:
     *    summary: Deletes a Material
     *    description: "Deletes a Material"
     *    tags: [Materials]
     *    produces:
     *    - application/json
     *    operationId: deleteMaterial
     *    responses:
     *      '200':
     *        description: Returns true with the id of the request deleted
     *    parameters:
     *    - $ref: '#/parameters/sessionId'
     *    - $ref: '#/parameters/material_id'
     */
    app.delete('/materials/:id', urlencodedParser, (req, res) => {
        API.materials().deleteMaterial("id", req.params.id, req.who)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });
};