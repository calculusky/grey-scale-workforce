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
     * /disconnection_billings:
     *   post:
     *     summary: Creates a Disconnection
     *     description: ''
     *     tags: [Disconnection Billings]
     *     consumes:
     *     - application/json
     *     - multipart/form-data
     *     produces:
     *     - application/json
     *     operationId: createDisconnectionBilling
     *     responses:
     *       '200':
     *         description: Successfully Added
     *     parameters:
     *      - $ref: '#/parameters/sessionId'
     *      - in: body
     *        name: 'disconnection'
     *        required: true
     *        schema:
     *          $ref: '#/definitions/postDisconnectionBillingInput'
     */
    app.post('/disconnection_billings', multiPart.array("files", 5), (req, res) => {
        API.disconnections().createDisconnectionBilling(req.body, req.who, req.files, API).then(({data, code}) => {
            console.log(data);
            return res.status(code).json(data);
        }).catch(({err, code}) => {
            console.log(code, err);
            return res.status(code).send(err);
        });
    });


    // /**
    //  * @swagger
    //  * /faults/{id}:
    //  *  delete:
    //  *    summary: Deletes a Fault
    //  *    description: "Deletes a Fault"
    //  *    tags: [Faults]
    //  *    produces:
    //  *    - application/json
    //  *    operationId: deleteFault
    //  *    responses:
    //  *      '200':
    //  *        description: Returns true with the id of the request deleted
    //  *    parameters:
    //  *    - $ref: '#/parameters/sessionId'
    //  *    - $ref: '#/parameters/id'
    //  */
    // app.delete('/faults/:id', urlencodedParser, (req, res) => {
    //     API.faults().deleteFault("id", req.params.id, req.who, API)
    //         .then(({data, code}) => {
    //             return res.status(code).send(data);
    //         })
    //         .catch(({err, code}) => {
    //             return res.status(code).send(err);
    //         });
    // });
};