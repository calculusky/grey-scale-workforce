/**
 * Created by paulex on 8/13/18.
 */


/**
 *
 * @param app
 * @param API {API}
 * @param jsonParser
 * @param urlencodedParser
 */
module.exports.controller = function (app, {API, jsonParser, urlencodedParser}) {
    app.use('/activities*', (req, res, next) => API.recognitions().auth(req, res, next));

    /**
     * @swagger
     * /activities:
     *   get:
     *     summary: Retrieves a List of activities
     *     description: ''
     *     tags: [Activities]
     *     produces:
     *     - application/json
     *     operationId: getActivities
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getActivityOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - $ref: '#/parameters/relation_id'
     *     - $ref: '#/parameters/module'
     *     - $ref: '#/parameters/activity_by'
     */
    app.get('/activities', urlencodedParser, (req, res) => {
        return API.activities().getActivities(req.query, req.who)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });


    /**
     * @swagger
     * /activities/{id}:
     *   get:
     *     summary: Retrieves a Single Activity
     *     description: ''
     *     tags: [Activities]
     *     produces:
     *     - application/json
     *     operationId: getActivity
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getActivityOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - $ref: '#/parameters/id'
     */
    app.get('/activities/:id', urlencodedParser, (req, res) => {
        return API.activities().getActivities(req.params['id'], undefined, req.who)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });

    /**
     * @swagger
     * /activities/search/{keyword}/{offset}/{limit}:
     *   get:
     *     summary: Search for a asset either by the Activity Name or by an Activity Type
     *     description: ''
     *     tags: [Activity]
     *     produces:
     *     - application/json
     *     operationId: searchActivities
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getCustomerOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - $ref: '#/parameters/keyword'
     *     - $ref: '#/parameters/offset'
     *     - $ref: '#/parameters/limit'
     */
    app.get('/activities/search/:keyword', urlencodedParser, (req, res) => {
        console.log('/activities/search/keyword');
        return API.activities().searchActivities(req.params['keyword'], req.query['offset'], req.query['limit'])
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });

    /**
     * @swagger
     * /activities/{id}:
     *  delete:
     *    summary: Deletes a Activity
     *    description: "Deletes a Activity"
     *    tags: [Activities]
     *    produces:
     *    - application/json
     *    operationId: deleteActivity
     *    responses:
     *      '200':
     *        description: Returns true with the id of the request deleted
     *    parameters:
     *    - $ref: '#/parameters/sessionId'
     *    - $ref: '#/parameters/asset_id'
     */
    app.delete('/activities/:id', urlencodedParser, (req, res) => {
        API.activities().deleteActivity("id", req.params.id)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });
};