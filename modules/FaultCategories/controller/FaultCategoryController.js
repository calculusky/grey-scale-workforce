/**
 * Created by paulex on 07/10/18.
 */

const Log = require(`${__dirname}/../../../core/logger`);

/**
 *
 * @param app
 * @param API {API}
 * @param jsonParser
 * @param urlencodedParser
 */
module.exports.controller = function (app, {API, jsonParser, urlencodedParser}) {
    // app.use('/groups*', (req, res, next) => API.recognitions().auth(req, res, next));


    /**
     * @swagger
     * /fault_categories:
     *   get:
     *     summary: Retrieves a List of Fault Categories
     *     description: ''
     *     tags: [Faults]
     *     produces:
     *     - application/json
     *     operationId: getGroups
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
    app.get('/fault_categories', urlencodedParser, (req, res) => {
        API.faultCategories().getFaultCategories(req.query, req.who).then(({data, code}) => {
            return res.status(code).send(data);
        }).catch(({err, code}) => {
            return res.status(code).send(err);
        });
    });
};