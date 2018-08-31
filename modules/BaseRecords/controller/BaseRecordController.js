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
     */
    app.put('/base_records/fault_category/:id', jsonParser, (req, res) => {
        API.baseRecords().updateFaultCategory("id", req.params['id'], req.body, req.who)
            .then(({data, code}) => res.status(code).send(data))
            .catch(({err, code}) => res.status(code).send(err))
    });
};