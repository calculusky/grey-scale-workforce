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
     * /groups:
     *   post:
     *     summary: Creates an Group
     *     description: ''
     *     tags: [Groups]
     *     consumes:
     *     - application/json
     *     produces:
     *     - application/json
     *     operationId: createGroup
     *     responses:
     *       '200':
     *         description: Successfully Added
     *     parameters:
     *      - $ref: '#/parameters/sessionId'
     *      - in: body
     *        name: 'group'
     *        required: true
     *        schema:
     *          $ref: '#/definitions/postGroupInput'
     */
    app.post('/groups', jsonParser, (req, res) => {
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
     * /groups/{id}:
     *   put:
     *     summary: Updates a Group
     *     description: ''
     *     tags: [Groups]
     *     consumes:
     *     - application/json
     *     produces:
     *     - application/json
     *     operationId: updateGroup
     *     responses:
     *       '200':
     *         description: Successfully Added
     *     parameters:
     *      - $ref: '#/parameters/sessionId'
     *      - $ref: '#/parameters/id'
     *      - in: body
     *        name: 'group'
     *        required: true
     *        schema:
     *          $ref: '#/definitions/postGroupInput'
     */
    app.put('/groups/:id', jsonParser, (req, res) => {
        API.groups().updateGroup(req.params['id'], req.body, req.who, API)
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
     * /groups/{offset}/{limit}:
     *   get:
     *     summary: Retrieves a List of groups
     *     description: ''
     *     tags: [Groups]
     *     produces:
     *     - application/json
     *     operationId: getGroups
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getGroupOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - $ref: '#/parameters/offset'
     *     - $ref: '#/parameters/limit'
     */
    app.get('/groups/:offset?/:limit?', urlencodedParser, (req, res) => {
        console.log('/groups/offset/limit');
        return API.groups().getGroups({}, undefined, req.who, req.params.offset || 0, req.params.limit || 10)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });


    /**
     * @swagger
     * /groups/{id}:
     *   get:
     *     summary: Retrieves a Single Group
     *     description: ''
     *     tags: [Groups]
     *     produces:
     *     - application/json
     *     operationId: getGroup
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getGroupOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - $ref: '#/parameters/group_id'
     */
    app.get('/groups/:id', urlencodedParser, (req, res) => {
        return API.groups().getGroups(req.params['id'], undefined, req.who)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });

    /**
     * @swagger
     * /groups/{id}:
     *  delete:
     *    summary: Deletes a Group
     *    description: "Deletes a Group"
     *    tags: [Groups]
     *    produces:
     *    - application/json
     *    operationId: deleteGroup
     *    responses:
     *      '200':
     *        description: Returns true with the id of the request deleted
     *    parameters:
     *    - $ref: '#/parameters/sessionId'
     *    - $ref: '#/parameters/group_id'
     */
    app.delete('/groups/:id', urlencodedParser, (req, res) => {
        API.groups().deleteGroup("id", req.params.id)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });
};