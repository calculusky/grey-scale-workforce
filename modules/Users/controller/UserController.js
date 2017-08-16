/**
 * @author Paul Okeke
 * Created by paulex on 7/4/17.
 */
const Log = require(`${__dirname}/../../../core/logger`);
const RecognitionService = require('../model/services/RecognitionService');

module.exports.controller = function (app, {API, jsonParser, urlencodedParser}) {
    app.use('/users*', (req, res, next)=>API.recognitions().auth(req, res, next));
    /**
     * @swagger
     * /login:
     *   post:
     *     description: "Authenticates a user to the service"
     *     summary: "Login User"
     *     tags: [User]
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
    app.post('/login', jsonParser, urlencodedParser, (req, res)=> {
        Log.info('/login', req.body);
        API.recognitions().login(req.body.username, req.body.password)
            .then(({data, code})=> {
                console.log(data);
                res.status(code).send(data);
            }).catch(({err, code})=> {
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
     *    tags: [User]
     *    produces:
     *    - application/json
     *    operationId: logoutUser
     *    responses:
     *      '200':
     *        description: "Logout out successfully"
     *    parameters:
     *    - $ref: '#/parameters/sessionId'
     */
    app.get('/logout', (req, res)=> {
        API.recognitions().logout(req.header('travel-session-id'))
            .then(msg=> {
                return res.send(msg);
            })
            .catch(err=> {
                return res.status(503).send(err);
            });
    });


    /**
     * @swagger
     * /users:
     *  post:
     *    description: 'Creates a new User'
     *    summary: "Creates a new User"
     *    tags: [User]
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
    app.post('/users', jsonParser, (req, res)=> {
        Log.info("/users", req.body);
        API.users().createUser(req.body, req.who)
            .then(({data, code})=> {
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
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
     *   tags: [User]
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
    app.get("/users/:id", urlencodedParser, (req, res)=> {
        Log.info('/users/:id', `/users/:${req.params.id}`);
        API.users().getUsers(req.params.id)
            .then(({data, code=200})=> {
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                return res.status(code).send(err);
            });
    });

    /**
     * @swagger
     * /users/{offset}/{limit}:
     *  get:
     *   description: "Retrieves a list of users by a given offset and limit.
     *                    A very good use-case is when implementing a pagination."
     *   summary: "Retrieves a list of users"
     *   tags: [User]
     *   produces:
     *   - application/json
     *   operationId: getUsers
     *   responses:
     *     '200':
     *       description: "A List of users"
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
    app.get("/users/:offset?/:limit?", urlencodedParser, (req, res)=> {
        Log.info(req.params);
        API.users().getUsers(req.params.id, undefined, req.who)
            .then(({data, code=200})=> {
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                return res.status(code).send(err);
            });
    });
};