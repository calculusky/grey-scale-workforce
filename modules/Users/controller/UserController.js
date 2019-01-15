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
 * @param multiPart
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
        Log.info('/login', req.body);
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
    app.get("/users/:id(\\d+)", urlencodedParser, (req, res) => {
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


    /**
     * @swagger
     * /users/search/keyword:
     *  get:
     *   description: "Search for users. The keyword is matched against username, first name, last name and middle name"
     *   summary: "Searches for a user that matches the :keyword supplied"
     *   tags: [Users]
     *   produces:
     *   - application/json
     *   operationId: "searchUsers"
     *   responses:
     *     '200':
     *       description: "A List of User Object"
     *       schema:
     *         $ref: '#/definitions/getUserOutput'
     *   parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - name: keyword
     *       description: A value to match against the user details
     *       in: path
     *       required: true
     *       type: string
     *     - $ref: '#/parameters/offset'
     *     - $ref: '#/parameters/limit'
     */
    app.get("/users/search/:keyword", urlencodedParser, (req, res) => {
        Log.info('/users/search/keyword', `/users/search/:${req.params.keyword}`);
        API.users().searchUsers(req.params['keyword'], req.query['offset'], req.query['limit'])
            .then(({data, code}) => {
                console.log('RES', data);
                return res.status(code).send(data);
            }).catch(({err, code = 500}) => {
            console.log(err);
            return res.status(code).send(err);
        });
    });


    /**
     * @swagger
     * /users/{id}/permissions:
     *  get:
     *   description: "Get a user permissions"
     *   summary: "Fetches a user permissions"
     *   tags: [Users]
     *   produces:
     *   - application/json
     *   operationId: "getUserPermissions"
     *   responses:
     *     '200':
     *       description: "A Permission Object"
     *       schema:
     *         $ref: '#/definitions/getUserPermission'
     *   parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - name: id
     *       description: The ID of the user
     *       in: path
     *       required: true
     *       type: integer
     */
    app.get("/users/:id/permissions", urlencodedParser, (req, res) => {
        API.users().getUserPermissions(req.params.id, req.who).then(({data, code}) => {
            return res.status(code).send(data);
        }).catch(({err, code = 500}) => {
            return res.status(code).send(err);
        });
    });

    /**
     * @swagger
     * /users/{id}/attachments:
     *  get:
     *   description: "Get list of attachments created by a user"
     *   summary: "Fetches attachments created by a user"
     *   tags: [Users]
     *   produces:
     *   - application/json
     *   operationId: "getUserAttachments"
     *   responses:
     *     '200':
     *       description: "A List of attachments"
     *       schema:
     *         $ref: '#/definitions/getUserAttachments'
     *   parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - name: id
     *       description: The ID of the user
     *       in: path
     *       required: true
     *       type: integer
     */
    app.get("/users/:id/attachments", urlencodedParser, (req, res) => {
        API.users().getUserAttachments(req.params.id, req.query['offset'], req.query['limit'], req.who, API).then(({data, code}) => {
            return res.status(code).send(data);
        }).catch(({err, code = 500}) => {
            return res.status(code).send(err);
        });
    });

    /**
     * @swagger
     * /users/{id}/work_orders:
     *  get:
     *   description: "Get list of work orders assigned to a user"
     *   summary: "Fetches work orders created by a user"
     *   tags: [Users]
     *   produces:
     *   - application/json
     *   operationId: "getUserWorkOrders"
     *   responses:
     *     '200':
     *       description: "A List of work orders"
     *       schema:
     *         $ref: '#/definitions/getUserWorkOrders'
     *   parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - name: id
     *       description: The ID of the user
     *       in: path
     *       required: true
     *       type: integer
     */
    app.get("/users/:id/work_orders", urlencodedParser, (req, res) => {
        API.users().getUserWorkOrders(req.params.id, req.query, req.who, API).then(({data, code}) => {
            return res.status(code).send(data);
        }).catch(({err, code = 500}) => {
            return res.status(code).send(err);
        });
    });


    /**
     * @swagger
     * /users/{id}/profile_image:
     *  get:
     *   description: "The User Profile Image"
     *   summary: "Get a user profile image"
     *   tags: [Users]
     *   produces:
     *   - application/json
     *   operationId: "getUserWorkOrders"
     *   responses:
     *     '200':
     *       description: "User Profile Image"
     *       schema:
     *         $ref: '#/definitions/getUserProfileImage'
     *   parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - name: id
     *       description: The ID of the user
     *       in: path
     *       required: true
     *       type: integer
     */
    app.get("/users/:id/profile_image", urlencodedParser, (req, res) => {
        return API.users().getUserProfileImage(req.params.id, req.who, API, res);
    });


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
            .catch(({err, code}) => {
                console.error('err', err);
                return res.status(code).send(err);
            });
    });

    /**
     * @swagger
     * /users/data-tables/records:
     *  get:
     *   description: "Get users record for data-tables"
     *   summary: "Update a User"
     *   tags: [Users]
     *   produces:
     *   - application/json
     *   operationId: getUserTableRecords
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
    app.get("/users/data-tables/records", (req, res) => {
        API.users().getUserTableRecords(req.query, req.who).then(data => {
            console.log(data);
            return res.send(JSON.stringify(data));
        }).catch(err => {
            console.error('err', err);
            return res.status(500).send(err);
        });
    });

    /**
     * @swagger
     * /password/reset:
     *  put:
     *   description: "Reset user password"
     *   summary: "Reset user password"
     *   tags: [Users]
     *   produces:
     *   - application/json
     *   operationId: resetPassword
     *   responses:
     *     '200':
     *       description: "User"
     *   parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - name: body
     *       in: body
     *       required: true
     *       schema:
     *         $ref: '#/definitions/postUserInput'
     */
    app.put("/password/reset", jsonParser, (req, res) => {
        Log.info("resetPassword:", req.body);
        API.users().resetPassword(req.body, req.who, API)
            .then(({data, code = 200}) => {
                console.log('success', data);
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
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
        API.users().deleteUser("id", req.params.id, req.who, API)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code = 500}) => {
                return res.status(code).send(err);
            });
    });
};