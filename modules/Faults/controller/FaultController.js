/**
 * Created by paulex on 7/18/17.
 */

const Log = require(`${__dirname}/../../../core/logger`);
/**
 *
 * @param app
 * @param API {API}
 * @param jsonParser
 * @param urlencodedParser
 * @param multiPart
 */
module.exports.controller = function (app, {API, jsonParser, urlencodedParser, multiPart}) {
    app.use('/faults*', (req, res, next) => API.recognitions().auth(req, res, next));

    /**
     * @swagger
     * /faults:
     *   post:
     *     summary: Creates a Fault
     *     description: ''
     *     tags: [Faults]
     *     consumes:
     *     - application/json
     *     - multipart/form-data
     *     produces:
     *     - application/json
     *     operationId: createFault
     *     responses:
     *       '200':
     *         description: Successfully Added
     *     parameters:
     *      - $ref: '#/parameters/sessionId'
     *      - in: body
     *        name: 'fault'
     *        required: true
     *        schema:
     *          $ref: '#/definitions/postFaultInput'
     */
    app.post('/faults', multiPart.array("files", 5), (req, res) => {
        console.log('...Create Faults...');
        API.faults().createFault(req.body, req.who, API, req.files).then(({data, code}) => {
            console.log(data);
            return res.status(code).json(data);
        }).catch(({err, code}) => {
            console.log(code, err);
            return res.status(code).send(err);
        });
    });

    /**
     * @swagger
     * /faults/{id}:
     *   put:
     *     summary: Updates a Fault
     *     description: ''
     *     tags: [Faults]
     *     consumes:
     *     - application/json
     *     produces:
     *     - application/json
     *     operationId: updateFault
     *     responses:
     *       '200':
     *         description: Successfully Added
     *     parameters:
     *      - $ref: '#/parameters/sessionId'
     *      - in: body
     *        name: 'fault'
     *        required: true
     *        schema:
     *          $ref: '#/definitions/postFaultInput'
     */
    app.put('/faults/:id', [multiPart.array("files", 5), jsonParser], (req, res) => {
        console.log('...Update Faults...');
        API.faults().updateFault('id', req.params['id'], req.body, req.who).then(({data, code}) => {
            console.log(data);
            return res.status(code).send(data);
        }).catch(({err, code}) => {
            console.log(code, err);
            return res.status(code).send(err);
        });
    });


    /**
     * @swagger
     * /faults:
     *   get:
     *     summary: Get a list of faults
     *     description: ''
     *     tags: [Faults]
     *     produces:
     *     - application/json
     *     operationId: getFaults
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getFaultOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     */
    app.get('/faults', urlencodedParser, (req, res) => {
        console.log('...Retrieve Faults...');
        return API.faults().getFaults(req.query, req.who).then(({data, code}) => {
            return res.status(code).send(data);
        }).catch(({err, code}) => {
            return res.status((code) ? code : 500).send((err) ? err : "Internal Server Error")
        });
    });


    /**
     * @swagger
     * /faults/{id}:
     *   get:
     *     summary: Get a fault
     *     description: ''
     *     tags: [Faults]
     *     produces:
     *     - application/json
     *     operationId: getFaults
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getFaultOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - $ref: '#/parameters/fault_id'
     */
    app.get('/faults/:id(\\d+)', urlencodedParser, (req, res) => {
        console.log('...Get Fault...');
        return API.faults().getFaults({"id": req.params['id']}, req.who).then(({data, code}) => {
            return res.status(code).send(data);
        }).catch(({err, code}) => {
            return res.status((code) ? code : 500).send((err) ? err : "Internal Server Error")
        });
    });

    /**
     * @swagger
     * /faults/{id}/work_orders:
     *   get:
     *     summary: Get work orders belonging to a fault
     *     description: ''
     *     tags: [Faults]
     *     produces:
     *     - application/json
     *     operationId: getWorkOrders
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getWorkOrderOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - $ref: '#/parameters/fault_id'
     */
    app.get('/faults/:id/work_orders', urlencodedParser, (req, res) => {
        console.log('...Get Fault WorkOrders...');
        const query = {relation_id: req.params['id'], type_id: "3"};
        return API.workOrders().getWorkOrders(query, req.who).then(({data, code}) => {
            return res.status(code).send(data);
        }).catch(({err, code}) => {
            return res.status((code) ? code : 500).send((err) ? err : "Internal Server Error")
        });
    });

    /**
     * @swagger
     * /faults/{id}/notes/{offset}/{limit}:
     *   get:
     *     summary: "List Fault Notes"
     *     description: ''
     *     tags: [faults]
     *     produces:
     *     - application/json
     *     operationId: getNotes
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getNoteOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - $ref: '#/parameters/fault_id'
     *     - $ref: '#/parameters/offset'
     *     - $ref: '#/parameters/limit'
     */
    app.get('/faults/:id/notes', urlencodedParser, (req, res) => {
        console.log('...Create Fault Notes...');
        return API.notes().getNotes(req.params['id'], "faults", req.who, "relation_id", req.query.offset || 0, req.query.limit || 10)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });

    /**
     * @swagger
     * /faults/data-tables/records:
     *  get:
     *   description: "Get faults record for data-tables"
     *   summary: "Update a User"
     *   tags: [Faults]
     *   produces:
     *   - application/json
     *   operationId: getFaultTableRecords
     *   responses:
     *     '200':
     *       description: "Fault"
     *       schema:
     *         type: array
     *         items:
     *           $ref: '#/definitions/getDataTablesOutput'
     *   parameters:
     *     - $ref: '#/parameters/sessionId'
     */
    app.get("/faults/data-tables/records", (req, res) => {
        API.faults().getFaultTableRecords(req.query, req.who).then(data => {
            return res.send(JSON.stringify(data));
        }).catch(err => {
            console.error('err', err);
            return res.status(500).send(err);
        });
    });


    /**
     * @swagger
     * /faults/{id}:
     *  delete:
     *    summary: Deletes a Fault
     *    description: "Deletes a Fault"
     *    tags: [Faults]
     *    produces:
     *    - application/json
     *    operationId: deleteFault
     *    responses:
     *      '200':
     *        description: Returns true with the id of the request deleted
     *    parameters:
     *    - $ref: '#/parameters/sessionId'
     *    - $ref: '#/parameters/id'
     */
    app.delete('/faults/:id', urlencodedParser, (req, res) => {
        API.faults().deleteFault("id", req.params.id, req.who, API)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });
};