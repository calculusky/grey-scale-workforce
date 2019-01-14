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
    app.use('/disconnection_billings*', (req, res, next) => API.recognitions().auth(req, res, next));

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

    /**
     * @swagger
     * /disconnection_billings/data-tables/records:
     *  get:
     *   description: "Get disconnection billing record for data-tables"
     *   summary: "Get disconnection billings records for data-tables"
     *   tags: [Disconnection Billings]
     *   produces:
     *   - application/json
     *   operationId: getDisconnectionBillingDataTableRecords
     *   responses:
     *     '200':
     *       description: "disconnection"
     *       schema:
     *         type: array
     *         items:
     *           $ref: '#/definitions/getDataTablesOutput'
     *   parameters:
     *     - $ref: '#/parameters/sessionId'
     */
    app.get("/disconnection_billings/data-tables/records", (req, res) => {
        API.disconnections().getDisconnectionBillingDataTableRecords(req.query, req.who).then(data => {
            console.log(data);
            return res.send(JSON.stringify(data));
        }).catch(err => {
            console.error('err', err);
            return res.status(500).send(err);
        });
    });
};