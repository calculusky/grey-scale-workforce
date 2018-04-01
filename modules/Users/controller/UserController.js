/**
 * @author Paul Okeke
 * Created by paulex on 7/4/17.
 */
const Log = require(`${__dirname}/../../../core/logger`);
// const RecognitionService = require('../model/services/RecognitionService');

/**
 *
 * @param app
 * @param API {API}
 * @param jsonParser
 * @param urlencodedParser
 */
module.exports.controller = function (app, {API, jsonParser, urlencodedParser, multiPart}) {
    app.use(['/users*', '/logout'], (req, res, next) => API.recognitions().auth(req, res, next));
    /**
     * @swagger
     * /login:
     *   post:
     *     description: "Authenticates an authorized user to the service"
     *     summary: "Authenticates an authorized user to the service"
     *     tags: [Users]
     *     consumes:
     *     - application/json
     *     produces:
     *     -  application/json
     *     operationId: loginUser
     *     responses:
     *       default:
     *         description: ''
     *         schema:
     *           $ref: '#/definitions/loginOutput'
     *     parameters:
     *       - in: body
     *         name: body
     *         required: true
     *         schema:
     *           $ref: '#/definitions/loginInput'
     *
     */
    app.post('/login', jsonParser, urlencodedParser, (req, res) => {
        // Log.info('/login', req.body);
        API.recognitions().login(req.body.username, req.body.password, req)
            .then(({data, code}) => {
                // console.log(data);
                res.status(code).send(data);
            }).catch(({err, code}) => {
            console.log(err);
            res.status(code).send(err);
        });
    });

    /**
     * @swagger
     * /logout:
     *  get:
     *    description: "Logout a user"
     *    summary: "Logout a User"
     *    tags: [Users]
     *    produces:
     *    - application/json
     *    operationId: logoutUser
     *    responses:
     *      '200':
     *        description: "Logout out successfully"
     *    parameters:
     *    - $ref: '#/parameters/sessionId'
     *    - $ref: '#/parameters/fireBaseToken'
     */
    app.get('/logout', (req, res) => {
        API.recognitions().logout(req.who, API, req)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(err => {
                return res.status(503).send(err);
            });
    });


    /**
     * @swagger
     * /users:
     *  post:
     *    description: 'Creates a new User'
     *    summary: "Creates a new User"
     *    tags: [Users]
     *    produces:
     *    - application/json
     *    operationId: "postUser"
     *    responses:
     *      '200':
     *        description: "Successfully created a new User"
     *        schema:
     *          $ref: '#/definitions/postUserOutput'
     *      '400':
     *        description: "Some fields are required"
     *      '401':
     *        description: "Unauthorized"
     *    parameters:
     *      - $ref: '#/parameters/sessionId'
     *      - name: body
     *        in: body
     *        required: true
     *        schema:
     *          $ref: '#/definitions/postUserInput'
     */
    app.post('/users', jsonParser, (req, res) => {
        Log.info("/users", req.body);
        API.users().createUser(req.body, req.who, API)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch((data) => {
                console.log('TESTOP):', data);
                const {code, err} = data;
                return res.status(code).send(err);
            });
    });

    /**
     * @swagger
     * /users/{id}:
     *  get:
     *   description: "To get a user details for a particular user by supplying the id.
     *                    Use when the ID is known"
     *   summary: "Retrieves a user details by the given ID"
     *   tags: [Users]
     *   produces:
     *   - application/json
     *   operationId: "getUser"
     *   responses:
     *     '200':
     *       description: "A User Object"
     *       schema:
     *         $ref: '#/definitions/getUserOutput'
     *   parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - name: id
     *       description: The ID of the user
     *       in: path
     *       required: true
     *       type: integer
     */
    app.get("/users/:id", urlencodedParser, (req, res) => {
        Log.info('/users/:id', `/users/:${req.params.id}`);
        API.users().getUsers(req.params.id)
            .then(({data, code}) => {
                console.log('RES', data);
                return res.status(code).send(data);
            }).catch(({err, code = 500}) => {
            console.log(err);
            return res.status(code).send(err);
        });
    });


    // /**
    //  * @swagger
    //  * /users/{offset}/{limit}:
    //  *  get:
    //  *   description: "Retrieves a list of users by a given offset and limit.
    //  *                    A very good use-case is when implementing a pagination."
    //  *   summary: "Retrieves a list of users"
    //  *   tags: [Users]
    //  *   produces:
    //  *   - application/json
    //  *   operationId: getUsers
    //  *   responses:
    //  *     '200':
    //  *       description: "A List of users"
    //  *       schema:
    //  *         type: array
    //  *         items:
    //  *           $ref: '#/definitions/getUserOutput'
    //  *   parameters:
    //  *     - $ref: '#/parameters/sessionId'
    //  *     - $ref: '#/parameters/offset'
    //  *     - $ref: '#/parameters/limit'
    //  *
    //  */
    // app.get("/users/:offset?/:limit?", urlencodedParser, (req, res)=> {
    //     Log.info(req.params);
    //     API.users().getUsers(req.params.id, undefined, req.who)
    //         .then(({data, code=200})=> {
    //             return res.status(code).send(data);
    //         })
    //         .catch(({err, code})=> {
    //             return res.status(code).send(err);
    //         });
    // });

    /**
     * @swagger
     * /users/{id}:
     *  put:
     *   description: "Update User Details"
     *   summary: "Update a User"
     *   tags: [Users]
     *   produces:
     *   - application/json
     *   operationId: updateUser
     *   responses:
     *     '200':
     *       description: "User"
     *       schema:
     *         type: array
     *         items:
     *           $ref: '#/definitions/getUserOutput'
     *   parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - name: body
     *       in: body
     *       required: true
     *       schema:
     *         $ref: '#/definitions/postUserInput'
     */
    app.put("/users/:id", multiPart.single("avatar"), (req, res) => {
        Log.info("updateUser:", req.body);
        API.users().updateUser('id', req.params['id'], req.body, req.who, req.file, API)
            .then(({data, code = 200}) => {
                console.log('success', data);
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                console.error('err', err);
                return res.status(code).send(err);
            });
    });

    /**
     *
     * @swag
     * /users/{id}/register/fcm/{token}:
     *  get:
     *   description: "Register a mobile user fire-base token"
     *   summary: "Register Fire-base token"
     *   tags: [Users]
     *   produces:
     *   - application/json
     *   operationId: registerToken
     *   responses:
     *     '200':
     *       description: "User"
     *       schema:
     *         type: array
     *         items:
     *           $ref: '#/definitions/getUserOutput'
     *   parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - $ref: '#/parameters/offset'
     *     - $ref: '#/parameters/limit'
     *
     */
    app.put("/users/register/fcm/:token", urlencodedParser, (req, res) => {
        Log.info("registerFcmToken:", req.params);
        API.users().registerFcmToken(req.params.token, req.who)
            .then(({data, code = 200}) => {
                console.log('success', data);
                return res.status(code).send(data);
            })
            .catch(({err, code = 500}) => {
                console.error('err', err);
                return res.status(code).send(err);
            });
    });


    /**
     * @swagger
     * /users/{id}:
     *  delete:
     *    summary: Deletes a User
     *    description: "Deletes a User"
     *    tags: [Users]
     *    produces:
     *    - application/json
     *    operationId: deleteUser
     *    responses:
     *      '200':
     *        description: Returns true with the id of the request deleted
     *    parameters:
     *    - $ref: '#/parameters/sessionId'
     *    - $ref: '#/parameters/id'
     */
    app.delete('/users/:id', urlencodedParser, (req, res) => {
        API.users().deleteUser("id", req.params.id, API)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code = 500}) => {
                return res.status(code).send(err);
            });
    });
};