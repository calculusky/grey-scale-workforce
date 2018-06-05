/**
 * Created by paulex on 8/22/17.
 */


/**
 *
 * @param app
 * @param API {API}
 * @param jsonParser
 * @param urlencodedParser
 */
module.exports.controller = function (app, {API, jsonParser, urlencodedParser}) {
    app.use('/material_requisitions*', (req, res, next) => API.recognitions().auth(req, res, next));

    /**
     * @swagger
     * /material_requisitions:
     *   post:
     *     summary: Creates an Asset
     *     description: ''
     *     tags: [Assets]
     *     consumes:
     *     - application/json
     *     produces:
     *     - application/json
     *     operationId: createAsset
     *     responses:
     *       '200':
     *         description: Successfully Added
     *     parameters:
     *      - $ref: '#/parameters/sessionId'
     *      - in: body
     *        name: 'asset'
     *        required: true
     *        schema:
     *          $ref: '#/definitions/postAssetInput'
     */
    app.post('/material_requisitions', jsonParser, (req, res) => {
        console.log(req.body);
        API.materialRequisition().createMaterialRequisition(req.body, req.who)
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
     * /material_requisitions:
     *   put:
     *     summary: Updates a Asset
     *     description: ''
     *     tags: [Assets]
     *     consumes:
     *     - application/json
     *     produces:
     *     - application/json
     *     operationId: updateAsset
     *     responses:
     *       '200':
     *         description: Successfully Added
     *     parameters:
     *      - $ref: '#/parameters/sessionId'
     *      - in: body
     *        name: 'asset'
     *        required: true
     *        schema:
     *          $ref: '#/definitions/postAssetInput'
     */
    app.put('/material_requisitions', jsonParser, (req, res) => {
        API.assets().updateAsset(req.body, req.who)
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
     * /material_requisitions/user/{user_id}/{offset}/{limit}:
     *   get:
     *     summary: Gets material_requisitions assigned to a user
     *     description: ''
     *     tags: [Assets]
     *     produces:
     *     - application/json
     *     operationId: getAssetsByUser
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getAssetOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - $ref: '#/parameters/user_id'
     *     - $ref: '#/parameters/offset'
     *     - $ref: '#/parameters/limit'
     */
    app.get('/material_requisitions/user/:user_id/:offset?/:limit?', urlencodedParser, (req, res) => {
        return API.assets().getAssets(req.params['user_id'], "assigned_to", req.who, req.params.offset, req.params.limit)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });


    /**
     * @swagger
     * /material_requisitions/{offset}/{limit}:
     *   get:
     *     summary: Retrieves a List of material_requisitions
     *     description: ''
     *     tags: [Assets]
     *     produces:
     *     - application/json
     *     operationId: getAssets
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getAssetOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - $ref: '#/parameters/offset'
     *     - $ref: '#/parameters/limit'
     */
    app.get('/material_requisitions/:offset(\\d+)?/:limit(\\d+)?', urlencodedParser, (req, res) => {
        console.log('/material_requisitions/offset/limit');
        return API.assets().getAssets({}, undefined, req.who, req.params.offset || 0, req.params.limit || 10)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });


    /**
     * @swagger
     * /material_requisitions/{id}:
     *   get:
     *     summary: Retrieves a Single Asset
     *     description: ''
     *     tags: [Assets]
     *     produces:
     *     - application/json
     *     operationId: getAsset
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getAssetOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - $ref: '#/parameters/asset_id'
     */
    app.get('/material_requisitions/:id', urlencodedParser, (req, res) => {
        return API.assets().getAssets(req.params['id'], undefined, req.who)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });

    /**
     * @swagger
     * /material_requisitions/search/{keyword}/{offset}/{limit}:
     *   get:
     *     summary: Search for a asset either by the Asset Name or by an Asset Type
     *     description: ''
     *     tags: [Assets]
     *     produces:
     *     - application/json
     *     operationId: searchAssets
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
    app.get('/material_requisitions/search/:keyword/:offset(\\d+)?/:limit(\\d+)?', urlencodedParser, (req, res) => {
        console.log('/material_requisitions/search/keyword');
        return API.assets().searchAssets(req.params['keyword'])
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });

    /**
     * @swagger
     * /material_requisitions/{id}:
     *  delete:
     *    summary: Deletes a Asset
     *    description: "Deletes a Asset"
     *    tags: [Assets]
     *    produces:
     *    - application/json
     *    operationId: deleteAsset
     *    responses:
     *      '200':
     *        description: Returns true with the id of the request deleted
     *    parameters:
     *    - $ref: '#/parameters/sessionId'
     *    - $ref: '#/parameters/asset_id'
     */
    app.delete('/material_requisitions/:id', urlencodedParser, (req, res) => {
        API.assets().deleteAsset("id", req.params.id)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });
};