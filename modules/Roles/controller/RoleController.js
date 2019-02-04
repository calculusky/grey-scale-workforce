/**
 * Created by paulex on 2/28/18.
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
    app.use('/roles*', (req, res, next) => API.recognitions().auth(req, res, next));

    /**
     * @swagger
     * /roles:
     *   post:
     *     summary: Creates an Role
     *     description: ''
     *     tags: [Roles]
     *     consumes:
     *     - application/json
     *     produces:
     *     - application/json
     *     operationId: createRole
     *     responses:
     *       '200':
     *         description: Successfully Added
     *     parameters:
     *      - $ref: '#/parameters/sessionId'
     *      - in: body
     *        name: 'role'
     *        required: true
     *        schema:
     *          $ref: '#/definitions/postRoleInput'
     */
    app.post('/roles', jsonParser, (req, res) => {
        console.log(req.body);
        API.roles().createRole(req.body, req.who)
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
     * /roles:
     *   put:
     *     summary: Updates a Role
     *     description: ''
     *     tags: [Roles]
     *     consumes:
     *     - application/json
     *     produces:
     *     - application/json
     *     operationId: updateRole
     *     responses:
     *       '200':
     *         description: Successfully Added
     *     parameters:
     *      - $ref: '#/parameters/sessionId'
     *      - in: body
     *        name: 'role'
     *        required: true
     *        schema:
     *          $ref: '#/definitions/postRoleInput'
     */
    app.put('/roles', jsonParser, (req, res) => {
        API.roles().updateRole(req.body, req.who)
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
     * /roles/{offset}/{limit}:
     *   get:
     *     summary: Retrieves a List of roles
     *     description: ''
     *     tags: [Roles]
     *     produces:
     *     - application/json
     *     operationId: getRoles
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getRoleOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - $ref: '#/parameters/offset'
     *     - $ref: '#/parameters/limit'
     */
    // app.get('/roles/:offset?/:limit?', urlencodedParser, (req, res) => {
    //     console.log('/roles/offset/limit');
    //     return API.roles().getRoles({}, undefined, req.who, req.params.offset || 0, req.params.limit || 10)
    //         .then(({data, code}) => {
    //             return res.status(code).send(data);
    //         })
    //         .catch(({err, code}) => {
    //             return res.status(code).send(err);
    //         });
    // });


    /**
     * @swagger
     * /roles/{id}:
     *   get:
     *     summary: Retrieves a Single Role
     *     description: ''
     *     tags: [Roles]
     *     produces:
     *     - application/json
     *     operationId: getRole
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getRoleOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - $ref: '#/parameters/role_id'
     */
    app.get('/roles/:id(\\d+)', urlencodedParser, (req, res) => {
        console.log("dfd");
        return API.roles().getRoles(req.params['id'], undefined, req.who)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });


    /**
     * @swagger
     * /roles/records:
     *  get:
     *   description: "Get roles record for data-tables"
     *   summary: "Update a User"
     *   tags: [Roles]
     *   produces:
     *   - application/json
     *   operationId: getRoleTableRecords
     *   responses:
     *     '200':
     *       description: "User"
     *       schema:
     *         type: array
     *         items:
     *           $ref: '#/definitions/getDataTablesOutput'
     *   parameters:
     *     - $ref: '#/parameters/sessionId'
     */
    app.get("/roles/data-tables/records", (req, res) => {
        API.roles().getRoleTableRecords(req.query, req.who).then(data => {
            console.log(data);
            return res.send(JSON.stringify(data));
        }).catch(err => {
            console.error('err', err);
            return res.status(500).send(err);
        });
    });



    /**
     * @swagger
     * /roles/{id}:
     *  delete:
     *    summary: Deletes a Role
     *    description: "Deletes a Role"
     *    tags: [Roles]
     *    produces:
     *    - application/json
     *    operationId: deleteRole
     *    responses:
     *      '200':
     *        description: Returns true with the id of the request deleted
     *    parameters:
     *    - $ref: '#/parameters/sessionId'
     *    - $ref: '#/parameters/role_id'
     */
    app.delete('/roles/:id', urlencodedParser, (req, res) => {
        API.roles().deleteRole("id", req.params.id, req.who)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });
};