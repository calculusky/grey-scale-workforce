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
        console.log(req.body);
        API.baseRecords().createPendingReason(req.body, req.who)
            .then(({data, code}) => {
                console.log(data);
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                console.log(code, err);
                return res.status(code).send(err);
            });
    });

};