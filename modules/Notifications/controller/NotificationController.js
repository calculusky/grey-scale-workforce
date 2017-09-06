/**
 * Created by paulex on 7/18/17.
 */

const Log = require(`${__dirname}/../../../core/logger`);
const RecognitionService = require('../../Users/model/services/RecognitionService');

module.exports.controller = function (app, {API, jsonParser, urlencodedParser, multiPart}) {
    app.use('/notifications*', (req, res, next)=>API.recognitions().auth(req, res, next));

    /**
     * @swagger
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
    app.post('/notifications', jsonParser, (req, res)=> {
        API.notifications().sendNotification(req.body, req.who, API)
            .then(({data, code})=> {
                // console.log(data);
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                console.log(code, err);
                return res.status(code).send(err);
            });
    });
    


    /**
     * @swagger
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
    app.get('/notifications/user/:user_id/:offset?/:limit?', urlencodedParser, (req, res)=> {
        let assignedTo = {id: req.params['user_id']};
        return API.notifications().getNotifications(`{"id":${req.params['user_id']}}`, "assigned_to->[]", req.who, req.params.offset, req.params.limit)
            .then(({data, code})=> {
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                return res.status(code).send(err);
            });
    });
    


    // /**
    //  * @swagger
    //  * /notifications/{offset}/{limit}:
    //  *   get:
    //  *     summary: Gets List of notifications
    //  *     description: ''
    //  *     tags: [Notification]
    //  *     produces:
    //  *     - application/json
    //  *     operationId: getNotifications
    //  *     responses:
    //  *       '200':
    //  *         description: Successful
    //  *         schema:
    //  *           $ref: '#/definitions/getNotificationOutput'
    //  *     parameters:
    //  *     - $ref: '#/parameters/sessionId'
    //  *     - $ref: '#/parameters/offset'
    //  *     - $ref: '#/parameters/limit'
    //  */
    // app.get('/notifications/:id', urlencodedParser, (req, res)=> {
    //     return API.notifications().getNotifications(req.params['id'], "id")
    //         .then(({data, code})=> {
    //             return res.status(code).send(data);
    //         })
    //         .catch(({err, code})=> {
    //             return res.status((code) ? code : 500).send((err) ? err : "Internal Server Error")
    //         });
    // });

    /**
     * @swagger
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
    app.delete('/notifications/:id', urlencodedParser, (req, res)=> {
        API.notifications().deleteNotification("id", req.params.id)
            .then(({data, code})=> {
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                return res.status(code).send(err);
            });
    });
};