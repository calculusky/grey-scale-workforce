/**
 * Created by paulex on 8/22/17.
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
    app.use('/groups*', (req, res, next) => API.recognitions().auth(req, res, next));

    /**
     * @swagger
     * /locations:
     *   post:
     *     summary: create a location history for a user
     *     description: ''
     *     tags: [Location]
     *     consumes:
     *     - application/json
     *     produces:
     *     - application/json
     *     operationId: createLocationHistory
     *     responses:
     *       '200':
     *         description: Successfully Added
     *     parameters:
     *      - $ref: '#/parameters/sessionId'
     *      - in: body
     *        name: 'group'
     *        required: true
     *        schema:
     *          $ref: '#/definitions/postLocationHistoryInput'
     */
    app.post('/locations', jsonParser, (req, res) => {
        console.log(req.body);
        API.groups().createGroup(req.body, req.who, API)
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
     * /locations:
     *   get:
     *     summary: Retrieves location history of users
     *     description: ''
     *     tags: [Location]
     *     produces:
     *     - application/json
     *     operationId: getLocationHistory
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getLocationHistoryOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - $ref: '#/parameters/groupId'
     *     - $ref: '#/parameters/userId'
     */
    app.get('/locations', urlencodedParser, (req, res) => {
        return API.locations().getLocationHistory(req.query, req.who, API)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });

};