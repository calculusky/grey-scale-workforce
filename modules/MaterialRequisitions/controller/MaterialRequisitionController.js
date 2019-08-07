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
     *     summary: Creates an MaterialRequisition
     *     description: ''
     *     tags: [MaterialRequisitions]
     *     consumes:
     *     - application/json
     *     produces:
     *     - application/json
     *     operationId: createMaterialRequisition
     *     responses:
     *       '200':
     *         description: Successfully Added
     *     parameters:
     *      - $ref: '#/parameters/sessionId'
     *      - in: body
     *        name: 'asset'
     *        required: true
     *        schema:
     *          $ref: '#/definitions/postMaterialRequisitionInput'
     */
    app.post('/material_requisitions', jsonParser, (req, res) => {
        console.log(req.body);
        API.materialRequisitions().createMaterialRequisition(req.body, req.who, API)
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
     *     summary: Updates a MaterialRequisition
     *     description: ''
     *     tags: [MaterialRequisitions]
     *     consumes:
     *     - application/json
     *     produces:
     *     - application/json
     *     operationId: updateMaterialRequisition
     *     responses:
     *       '200':
     *         description: Successfully Added
     *     parameters:
     *      - $ref: '#/parameters/sessionId'
     *      - in: body
     *        name: 'asset'
     *        required: true
     *        schema:
     *          $ref: '#/definitions/postMaterialRequisitionInput'
     */
    app.put('/material_requisitions', jsonParser, (req, res) => {
        API.materialRequisitions().updateMaterialRequisition(req.body, req.who)
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
     *   get:
     *     summary: Retrieves a List of material_requisitions
     *     description: ''
     *     tags: [MaterialRequisitions]
     *     produces:
     *     - application/json
     *     operationId: getMaterialRequisitions
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getMaterialRequisitionOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - $ref: '#/parameters/offset'
     *     - $ref: '#/parameters/limit'
     */
    app.get('/material_requisitions', urlencodedParser, (req, res) => {
        return API.materialRequisitions().getMaterialRequisitions(req.query, req.who)
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
     *     summary: Retrieves a Single MaterialRequisition
     *     description: ''
     *     tags: [MaterialRequisitions]
     *     produces:
     *     - application/json
     *     operationId: getMaterialRequisition
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getMaterialRequisitionOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - $ref: '#/parameters/asset_id'
     */
    app.get('/material_requisitions/:id', urlencodedParser, (req, res) => {
        return API.materialRequisitions().getMaterialRequisition(req.params['id'], undefined, req.who)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });


    /**
     * @swagger
     * /material_requisitions/{id}/material/{id}/approve:
     *   get:
     *     summary: Approves a single material in the material requisition
     *     description: ''
     *     tags: [MaterialRequisitions]
     *     produces:
     *     - application/json
     *     operationId: approveRequisitionMaterial
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - $ref: '#/parameters/asset_id'
     */
    app.get('/material_requisitions/:id/material/:material_id/approve', urlencodedParser, (req, res) => {
        return res.status(200).send("Not Implemented Yet");
    });

    /**
     * @swagger
     * /material_requisitions/{id}/material/{id}/reject:
     *   get:
     *     summary: Rejects a single material in the material requisition
     *     description: ''
     *     tags: [MaterialRequisitions]
     *     produces:
     *     - application/json
     *     operationId: rejectRequisitionMaterial
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - $ref: '#/parameters/asset_id'
     */
    app.get('/material_requisitions/:id/material/:material_id/reject', urlencodedParser, (req, res) => {
        return res.status(200).send("Not Implemented Yet");
    });

    /**
     * @swagger
     * /material_requisitions/{id}:
     *  delete:
     *    summary: Deletes a MaterialRequisition
     *    description: "Deletes a MaterialRequisition"
     *    tags: [MaterialRequisitions]
     *    produces:
     *    - application/json
     *    operationId: deleteMaterialRequisition
     *    responses:
     *      '200':
     *        description: Returns true with the id of the request deleted
     *    parameters:
     *    - $ref: '#/parameters/sessionId'
     *    - $ref: '#/parameters/asset_id'
     */
    app.delete('/material_requisitions/:id', urlencodedParser, (req, res) => {
        API.materialRequisitions().deleteMaterialRequisition("id", req.params.id, req.who)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });
};