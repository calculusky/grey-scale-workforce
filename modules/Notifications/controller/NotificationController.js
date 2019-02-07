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
    app.use('/notifications*', (req, res, next) => API.recognitions().auth(req, res, next));

    /**
     * @swag
     * /notifications:
     *   post:
     *     summary: Send Notification
     *     description: ''
     *     tags: [Notification]
     *     consumes:
     *     - application/json
     *     produces:
     *     - application/json
     *     operationId: createNotification
     *     responses:
     *       '200':
     *         description: Successfully Added
     *     parameters:
     *      - $ref: '#/parameters/sessionId'
     *      - in: body
     *        name: 'fault'
     *        required: true
     *        schema:
     *          $ref: '#/definitions/postNotificationInput'
     */
    app.post('/notifications', jsonParser, (req, res) => {
        API.notifications().sendNotification(req.body, req.who, API)
            .then(({data, code}) => {
                // console.log(data);
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                console.log(code, err);
                return res.status(code).send(err);
            });
    });


    /**
     * @swag
     * /notifications/user/{user_id}/{offset}/{limit}:
     *   get:
     *     summary: Gets notifications assigned to a user
     *     description: ''
     *     tags: [Notification]
     *     produces:
     *     - application/json
     *     operationId: getNotifications
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getNotificationOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - in: path
     *       name: user_id
     *       required: true
     *     - $ref: '#/parameters/offset'
     *     - $ref: '#/parameters/limit'
     */
    app.get('/notifications/user/:user_id/:offset?/:limit?', urlencodedParser, (req, res) => {
        return API.notifications().getNotifications(`${req.params['user_id']}`, "to->[]", req.who, req.params.offset, req.params.limit)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });

    /**
     * @swag
     * /notifications/{id}:
     *  put:
     *    summary: Updates a Notification
     *    description: "Updates a Notification"
     *    tags: [Notification]
     *    produces:
     *    - application/json
     *    operationId: updateNotification
     *    responses:
     *      '200':
     *        description: Returns true with the id of the request updated
     *    parameters:
     *    - $ref: '#/parameters/sessionId'
     *    - $ref: '#/parameters/fault_id'
     */
    app.put('/notifications/:id', urlencodedParser, (req, res) => {
        API.notifications().updateNotification(req.params.id, "id", req.body, req.who, API)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });

    /**
     * @swag
     * /notifications:
     *  put:
     *    summary: Updates multiple notification
     *    description: "Updates multiple Notification status etc."
     *    tags: [Notification]
     *    produces:
     *    - application/json
     *    operationId: updateMultipleNotifications
     *    responses:
     *      '200':
     *        description: Returns an array of status code for each updated notification
     *    parameters:
     *    - $ref: '#/parameters/sessionId'
     *    - $ref: '#/parameters/fault_id'
     */
    app.put('/notifications', urlencodedParser, (req, res) => {
        API.notifications().updateMultipleNotifications( req.body, req.who, API)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });

    /**
     * @swag
     * /notifications/{id}:
     *  delete:
     *    summary: Deletes a Notification
     *    description: "Deletes a Notification"
     *    tags: [Notification]
     *    produces:
     *    - application/json
     *    operationId: deleteNotification
     *    responses:
     *      '200':
     *        description: Returns true with the id of the request deleted
     *    parameters:
     *    - $ref: '#/parameters/sessionId'
     *    - $ref: '#/parameters/fault_id'
     */
    app.delete('/notifications/:id', urlencodedParser, (req, res) => {
        API.notifications().deleteNotification("id", req.params.id)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });
};