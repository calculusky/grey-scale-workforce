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
    app.use('/assets*', (req, res, next) => API.recognitions().auth(req, res, next));

    /**
     * @swagger
     * /assets:
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
    app.post('/assets', jsonParser, (req, res) => {
        console.log(req.body);
        API.assets().createAsset(req.body, req.who)
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
     * /assets:
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
    app.put('/assets', jsonParser, (req, res) => {
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
     * /assets/{offset}/{limit}:
     *   get:
     *     summary: Retrieves a List of assets
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
    app.get('/assets', urlencodedParser, (req, res) => {
        console.log('/assets');
        return API.assets().getAssets(req.query, req.who)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });


    /**
     * @swagger
     * /assets/{id}:
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
    app.get('/assets/:id', urlencodedParser, (req, res) => {
        return API.assets().getAsset(req.params['id'], undefined, req.who)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });

    /**
     * @swagger
     * /assets/search/{keyword}/{offset}/{limit}:
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
    app.get('/assets/search/:keyword', urlencodedParser, (req, res) => {
        console.log('/assets/search/keyword');
        return API.assets().searchAssets(req.params['keyword'], req.query['offset'], req.query['limit'])
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });

    /**
     * @swagger
     * /assets/{id}/faults:
     *   get:
     *     summary: Get all faults related to an asset
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
     *     - $ref: '#/parameters/asset_id'
     */
    app.get('/assets/:id/faults', urlencodedParser, (req, res) => {
        return API.assets().getAssetFaults(req.params['id'], req.who)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });

    /**
     * @swagger
     * /assets/{id}:
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
    app.delete('/assets/:id', urlencodedParser, (req, res) => {
        API.assets().deleteAsset("id", req.params.id)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });
};