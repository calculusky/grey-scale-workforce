/**
 * Created by paulex on 6/05/18.
 */


/**
 *
 * @param app
 * @param API {API}
 * @param jsonParser
 * @param urlencodedParser
 */
module.exports.controller = function (app, {API, jsonParser, urlencodedParser}) {
    app.use('/stock_movements*', (req, res, next) => API.recognitions().auth(req, res, next));
    //
    // /**
    //  * @swagger
    //  * /stock_movements:
    //  *   post:
    //  *     summary: Creates an Asset
    //  *     description: ''
    //  *     tags: [Assets]
    //  *     consumes:
    //  *     - application/json
    //  *     produces:
    //  *     - application/json
    //  *     operationId: createAsset
    //  *     responses:
    //  *       '200':
    //  *         description: Successfully Added
    //  *     parameters:
    //  *      - $ref: '#/parameters/sessionId'
    //  *      - in: body
    //  *        name: 'stock_movement'
    //  *        required: true
    //  *        schema:
    //  *          $ref: '#/definitions/postAssetInput'
    //  */
    // app.post('/stock_movements', jsonParser, (req, res)=> {
    //     console.log(req.body);
    //     API.stock_movements().createAsset(req.body, req.who)
    //         .then(({data, code})=> {
    //             console.log(data);
    //             return res.status(code).send(data);
    //         })
    //         .catch(({err, code})=> {
    //             console.log(code, err);
    //             return res.status(code).send(err);
    //         });
    // });
    //
    // /**
    //  * @swagger
    //  * /stock_movements:
    //  *   put:
    //  *     summary: Updates a Asset
    //  *     description: ''
    //  *     tags: [Assets]
    //  *     consumes:
    //  *     - application/json
    //  *     produces:
    //  *     - application/json
    //  *     operationId: updateAsset
    //  *     responses:
    //  *       '200':
    //  *         description: Successfully Added
    //  *     parameters:
    //  *      - $ref: '#/parameters/sessionId'
    //  *      - in: body
    //  *        name: 'stock_movement'
    //  *        required: true
    //  *        schema:
    //  *          $ref: '#/definitions/postAssetInput'
    //  */
    // app.put('/stock_movements', jsonParser, (req, res)=> {
    //     API.stock_movements().updateAsset(req.body, req.who)
    //         .then(({data, code})=> {
    //             console.log(data);
    //             return res.status(code).send(data);
    //         })
    //         .catch(({err, code})=> {
    //             console.log(code, err);
    //             return res.status(code).send(err);
    //         });
    // });
    //
    //
    // /**
    //  * @swagger
    //  * /stock_movements/user/{user_id}/{offset}/{limit}:
    //  *   get:
    //  *     summary: Gets stock_movements assigned to a user
    //  *     description: ''
    //  *     tags: [Assets]
    //  *     produces:
    //  *     - application/json
    //  *     operationId: getAssetsByUser
    //  *     responses:
    //  *       '200':
    //  *         description: Successful
    //  *         schema:
    //  *           $ref: '#/definitions/getAssetOutput'
    //  *     parameters:
    //  *     - $ref: '#/parameters/sessionId'
    //  *     - $ref: '#/parameters/user_id'
    //  *     - $ref: '#/parameters/offset'
    //  *     - $ref: '#/parameters/limit'
    //  */
    // app.get('/stock_movements/user/:user_id/:offset?/:limit?', urlencodedParser, (req, res)=> {
    //     return API.stock_movements().getAssets(req.params['user_id'], "assigned_to", req.who, req.params.offset, req.params.limit)
    //         .then(({data, code})=> {
    //             return res.status(code).send(data);
    //         })
    //         .catch(({err, code})=> {
    //             return res.status(code).send(err);
    //         });
    // });
    //
    //
    // /**
    //  * @swagger
    //  * /stock_movements/{offset}/{limit}:
    //  *   get:
    //  *     summary: Retrieves a List of stock_movements
    //  *     description: ''
    //  *     tags: [Assets]
    //  *     produces:
    //  *     - application/json
    //  *     operationId: getAssets
    //  *     responses:
    //  *       '200':
    //  *         description: Successful
    //  *         schema:
    //  *           $ref: '#/definitions/getAssetOutput'
    //  *     parameters:
    //  *     - $ref: '#/parameters/sessionId'
    //  *     - $ref: '#/parameters/offset'
    //  *     - $ref: '#/parameters/limit'
    //  */
    // app.get('/stock_movements/:offset(\\d+)?/:limit(\\d+)?', urlencodedParser, (req, res) => {
    //     console.log('/stock_movements/offset/limit');
    //     return API.stock_movements().getAssets({}, undefined, req.who, req.params.offset || 0, req.params.limit || 10)
    //         .then(({data, code})=> {
    //             return res.status(code).send(data);
    //         })
    //         .catch(({err, code})=> {
    //             return res.status(code).send(err);
    //         });
    // });
    //
    //
    // /**
    //  * @swagger
    //  * /stock_movements/{id}:
    //  *   get:
    //  *     summary: Retrieves a Single Asset
    //  *     description: ''
    //  *     tags: [Assets]
    //  *     produces:
    //  *     - application/json
    //  *     operationId: getAsset
    //  *     responses:
    //  *       '200':
    //  *         description: Successful
    //  *         schema:
    //  *           $ref: '#/definitions/getAssetOutput'
    //  *     parameters:
    //  *     - $ref: '#/parameters/sessionId'
    //  *     - $ref: '#/parameters/stock_movement_id'
    //  */
    // app.get('/stock_movements/:id', urlencodedParser, (req, res)=> {
    //     return API.stock_movements().getAssets(req.params['id'], undefined, req.who)
    //         .then(({data, code})=> {
    //             return res.status(code).send(data);
    //         })
    //         .catch(({err, code})=> {
    //             return res.status(code).send(err);
    //         });
    // });
    //
    // /**
    //  * @swagger
    //  * /stock_movements/search/{keyword}/{offset}/{limit}:
    //  *   get:
    //  *     summary: Search for a stock_movement either by the Asset Name or by an Asset Type
    //  *     description: ''
    //  *     tags: [Assets]
    //  *     produces:
    //  *     - application/json
    //  *     operationId: searchAssets
    //  *     responses:
    //  *       '200':
    //  *         description: Successful
    //  *         schema:
    //  *           $ref: '#/definitions/getCustomerOutput'
    //  *     parameters:
    //  *     - $ref: '#/parameters/sessionId'
    //  *     - $ref: '#/parameters/keyword'
    //  *     - $ref: '#/parameters/offset'
    //  *     - $ref: '#/parameters/limit'
    //  */
    // app.get('/stock_movements/search/:keyword/:offset(\\d+)?/:limit(\\d+)?', urlencodedParser, (req, res) => {
    //     console.log('/stock_movements/search/keyword');
    //     return API.stock_movements().searchAssets(req.params['keyword'])
    //         .then(({data, code})=> {
    //             return res.status(code).send(data);
    //         })
    //         .catch(({err, code})=> {
    //             return res.status(code).send(err);
    //         });
    // });
    //
    // /**
    //  * @swagger
    //  * /stock_movements/{id}:
    //  *  delete:
    //  *    summary: Deletes a Asset
    //  *    description: "Deletes a Asset"
    //  *    tags: [Assets]
    //  *    produces:
    //  *    - application/json
    //  *    operationId: deleteAsset
    //  *    responses:
    //  *      '200':
    //  *        description: Returns true with the id of the request deleted
    //  *    parameters:
    //  *    - $ref: '#/parameters/sessionId'
    //  *    - $ref: '#/parameters/stock_movement_id'
    //  */
    // app.delete('/stock_movements/:id', urlencodedParser, (req, res)=> {
    //     API.stock_movements().deleteAsset("id", req.params.id)
    //         .then(({data, code})=> {
    //             return res.status(code).send(data);
    //         })
    //         .catch(({err, code})=> {
    //             return res.status(code).send(err);
    //         });
    // });
};