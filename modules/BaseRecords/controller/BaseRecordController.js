/**
 * Created by paulex on 8/30/18.
 */


/**
 *
 * @param app
 * @param API {API}
 * @param jsonParser
 * @param urlencodedParser
 */
module.exports.controller = function (app, {API, jsonParser, urlencodedParser}) {
    app.use('/base_records*', (req, res, next) => API.recognitions().auth(req, res, next));

    /**
     * @swagger
     * /base_records/pending_reason:
     *   post:
     *     summary: Creates a new pending reason
     *     description: ''
     *     tags: [Base Records]
     *     consumes:
     *     - application/json
     *     produces:
     *     - application/json
     *     operationId: createPendingReason
     *     responses:
     *       '200':
     *         description: Successfully Added
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     */
    app.post('/base_records/pending_reason', jsonParser, (req, res) => {
        API.baseRecords().createPendingReason(req.body, req.who)
            .then(({data, code}) => res.status(code).send(data))
            .catch(({err, code}) => res.status(code).send(err));
    });

    /**
     * @swagger
     * /base_records/pending_reason/{id}:
     *   put:
     *     summary: Creates a new pending reason
     *     description: ''
     *     tags: [Base Records]
     *     consumes:
     *     - application/json
     *     produces:
     *     - application/json
     *     operationId: createPendingReason
     *     responses:
     *       '200':
     *         description: Successfully Added
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     */
    app.put('/base_records/pending_reason/:id', jsonParser, (req, res) => {
        API.baseRecords().updatePendingReason("id", req.params['id'], req.body, req.who)
            .then(({data, code}) => res.status(code).send(data))
            .catch(({err, code}) => res.status(code).send(err));
    });


    /**
     * @swagger
     * /base_records/fault_category:
     *   post:
     *     summary: Creates a new fault category
     *     description: ''
     *     tags: [Base Records]
     *     consumes:
     *     - application/json
     *     produces:
     *     - application/json
     *     operationId: createFaultCategory
     *     responses:
     *       '200':
     *         description: Successfully Added
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     */
    app.post('/base_records/fault_category', jsonParser, (req, res) => {
        API.baseRecords().createFaultCategory(req.body, req.who)
            .then(({data, code}) => res.status(code).send(data))
            .catch(({err, code}) => res.status(code).send(err));
    });


    /**
     * @swagger
     * /base_records/fault_category/{id}:
     *   put:
     *     summary: Update fault category
     *     description: ''
     *     tags: [Base Records]
     *     consumes:
     *     - application/json
     *     produces:
     *     - application/json
     *     operationId: updateFaultCategory
     *     responses:
     *       '200':
     *         description: Successfully Added
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     */
    app.put('/base_records/fault_category/:id', jsonParser, (req, res) => {
        API.baseRecords().updateFaultCategory("id", req.params['id'], req.body, req.who)
            .then(({data, code}) => res.status(code).send(data))
            .catch(({err, code}) => res.status(code).send(err))
    });

    /**
     * @swagger
     * /base_records/fault_categories:
     *   get:
     *     summary: Retrieves a List of Fault Categories
     *     description: ''
     *     tags: [Base Records]
     *     produces:
     *     - application/json
     *     operationId: getFaultCategories
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getFaultCategories'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - $ref: '#/parameters/offset'
     *     - $ref: '#/parameters/limit'
     */
    app.get('/base_records/fault_categories', urlencodedParser, (req, res) => {
        API.baseRecords().getFaultCategories(req.query, req.who).then(({data, code}) => {
            return res.status(code).send(data);
        }).catch(({err, code}) => {
            return res.status(code).send(err);
        });
    });

    /**
     * @swagger
     * /base_records/status:
     *   post:
     *     summary: Creates a new status
     *     description: ''
     *     tags: [Base Records]
     *     consumes:
     *     - application/json
     *     produces:
     *     - application/json
     *     operationId: createStatus
     *     responses:
     *       '200':
     *         description: Successfully Added
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     */
    app.post('/base_records/status', jsonParser, (req, res) => {
        API.baseRecords().createStatus(req.body, req.who)
            .then(({data, code}) => res.status(code).send(data))
            .catch(({err, code}) => res.status(code).send(err));
    });

    /**
     * @swagger
     * /base_records/status:
     *   get:
     *     summary: Retrieves status defined for the application
     *     description: ''
     *     tags: [Base Records]
     *     produces:
     *     - application/json
     *     operationId: getStatuses
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getStatuses'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     */
    app.get('/base_records/status', urlencodedParser, (req, res) => {
        API.baseRecords().getStatuses(req.query, req.who)
            .then(({data, code}) => res.status(code).send(data))
            .catch(({err, code}) => res.status(code).send(err));
    });
};