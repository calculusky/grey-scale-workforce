/**
 * Created by paulex on 8/22/17.
 */

const Log = require(`${__dirname}/../../../core/logger`);
const RecognitionService = require('../../Users/model/services/RecognitionService');

module.exports.controller = function (app, {API, jsonParser, urlencodedParser}) {
    app.use('/assets*', (req, res, next)=>API.recognitions().auth(req, res, next));

    /**
     * @swagger
     * /assets:
     *   post:
     *     summary: Creates an Asset
     *     description: ''
     *     tags: [Asset]
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
     *        name: 'fault'
     *        required: true
     *        schema:
     *          $ref: '#/definitions/postAssetInput'
     */
    app.post('/assets', jsonParser, (req, res)=> {
        console.log(req.body);
        API.assets().createAsset(req.body, req.who)
            .then(({data, code})=> {
                console.log(data);
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
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
     *     tags: [Asset]
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
     *        name: 'fault'
     *        required: true
     *        schema:
     *          $ref: '#/definitions/postAssetInput'
     */
    app.put('/assets', jsonParser, (req, res)=> {
        API.assets().updateAsset(req.body, req.who)
            .then(({data, code})=> {
                console.log(data);
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                console.log(code, err);
                return res.status(code).send(err);
            });
    });


    /**
     * @swagger
     * /assets/user/{user_id}/{offset}/{limit}:
     *   get:
     *     summary: Gets assets assigned to a user
     *     description: ''
     *     tags: [Asset]
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
     *     - in: path
     *       name: user_id
     *       required: true
     *     - $ref: '#/parameters/offset'
     *     - $ref: '#/parameters/limit'
     */
    app.get('/assets/user/:user_id/:offset?/:limit?', urlencodedParser, (req, res)=> {
        return API.assets().getAssets(req.params['user_id'], "assigned_to", req.who, req.params.offset, req.params.limit)
            .then(({data, code})=> {
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                return res.status(code).send(err);
            });
    });


    /**
     * @swagger
     * /assets/{offset}/{limit}:
     *   get:
     *     summary: Gets List of assets
     *     description: ''
     *     tags: [Asset]
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
    app.get('/assets/:offset?/:limit?', urlencodedParser, (req, res)=> {
        console.log('/assets/offset/limit');
        return API.assets().getAssets({}, undefined, req.who, req.params.offset || 0, req.params.limit || 10)
            .then(({data, code})=> {
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                return res.status(code).send(err);
            });
    });


    /**
     * @swagger
     * /assets/{id}:
     *   get:
     *     summary: Gets a single asset
     *     description: ''
     *     tags: [Asset]
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
    app.get('/assets/:id', urlencodedParser, (req, res)=> {
        console.log('/assets/offset/limit');
        return API.assets().getAssets(req.params['id'], undefined, req.who)
            .then(({data, code})=> {
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                return res.status(code).send(err);
            });
    });

    /**
     * @swagger
     * /assets/search/{keyword}:
     *   get:
     *     summary: Search for a asset either by the Asset Name or by an Asset Type
     *     description: ''
     *     tags: [Asset]
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
     *     - $ref: '#/parameters/offset'
     *     - $ref: '#/parameters/limit'
     */
    app.get('/assets/search/:keyword', urlencodedParser, (req, res)=> {
        console.log('/assets/search/keyword');
        return API.assets().searchAssets(req.params['keyword'])
            .then(({data, code})=> {
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                return res.status(code).send(err);
            });
    });

    /**
     * @swagger
     * /assets/{id}:
     *  delete:
     *    summary: Deletes a Asset
     *    description: "Deletes a Asset"
     *    tags: [Asset]
     *    produces:
     *    - application/json
     *    operationId: deleteAsset
     *    responses:
     *      '200':
     *        description: Returns true with the id of the request deleted
     *    parameters:
     *    - $ref: '#/parameters/sessionId'
     *    - $ref: '#/parameters/fault_id'
     */
    app.delete('/assets/:id', urlencodedParser, (req, res)=> {
        API.assets().deleteAsset("id", req.params.id)
            .then(({data, code})=> {
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                return res.status(code).send(err);
            });
    });
};