/**
 * Created by paulex on 7/5/17.
 */
const RecognitionService = require('../../Users/model/services/RecognitionService');
module.exports.controller = function (app, {API, jsonParser, urlencodedParser}) {
    app.use('/request*', (req, res, next)=>API.recognitions().auth(req, res, next));
    /**
     * @swagger
     * /request:
     *  post:
     *    description: "Creates a new Travel Request"
     *    summary: "Create a new Travel Request"
     *    tags: ['Travel Request']
     *    produces:
     *    - application/json
     *    operationId: postRequest
     *    responses:
     *      '200':
     *        description: Created Successfully
     *        schema:
     *          $ref: '#/definitions/postRequestOutput'
     *    parameters:
     *    - $ref: '#/parameters/sessionId'
     *    - name: "travel-request"
     *      in: body
     *      required: true
     *      schema:
     *        $ref: '#/definitions/postRequestInput'
     */
    app.post('/request', jsonParser, (req, res)=> {
        console.log(req.body);
        API.travels().createTravelRequest(req.body, req.who)
            .then(({data, code})=> {
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                return res.status(code).send(err);
            });
    });


    /**
     * @swagger
     * /requests/{id}:
     *   put:
     *     summary: "Update an existing travel request."
     *     description: "Update an already existing travel request"
     *     tags: ['Travel Request']
     *     produces:
     *     - application/json
     *     operationId: "updateRequest"
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/postRequestOutput'
     *     parameters:
     *       - $ref: '#/parameters/sessionId'
     *       - $ref : '#/parameters/req_id'
     *       - name: 'travel-request'
     *         in: body
     *         required: true
     *         schema:
     *           $ref: '#/definitions/postRequestInput'
     */
    app.put('/requests/:id', jsonParser, (req, res)=> {
        res.send("Not yet implemented");
        // API.travels().getTravelRequests(req.body, req.who)
        //     .then(({data, code})=>{
        //         return res.status(code).send(data);
        //     })
        //     .catch(({err, code})=>{
        //         return res.status(code).send(err);
        //     });
    });


    /**
     * @swagger
     * /requests/{id}:
     *   get:
     *     description: "Returns a Specific Travel Request by the given ID"
     *     summary: "Finds a Travel Request by the given ID"
     *     tags: ['Travel Request']
     *     consumes:
     *     - application/json
     *     produces:
     *     - application/json
     *     operationId: "getRequest"
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getRequestOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - name: id
     *       description: Request ID
     *       in: path
     *       required: true
     *       type: integer
     */
    app.get('/requests/:id', (req, urlencodedParser, res)=> {
        API.travels().getTravelRequests(req.params.id, undefined, req.who)
            .then(({data, code})=> {
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                return res.status(code).send(err);
            });
    });


    /**
     * @swagger
     * /requests/status/{statusId}/{offset}/{limit}:
     *  get:
     *    summary: "Retrieves a Travel Request by status"
     *    description: "This can be used to retrieve travel request based on their status conditions.
     *                    e.g Approved Request, Pending Request or Rejected Request"
     *    tags: ['Travel Request']
     *    produces:
     *    - application/json
     *    operationId: "getRequestByStatus"
     *    responses:
     *      '200':
     *        description: A list of Travel Request
     *        schema:
     *          type: array
     *          items:
     *            $ref: '#/definitions/getRequestOutput'
     *    parameters:
     *      - $ref: '#/parameters/sessionId'
     *      - $ref: '#/parameters/req_status'
     *      - $ref: '#/parameters/offset'
     *      - $ref: '#/parameters/limit'
     */
    app.get('/requests/status/:statusId', urlencodedParser, (req, res)=> {
        API.travels().getTravelRequests(req.params.statusId, "status", req.who)
            .then(({data, code})=> {
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                return res.status(code).send(err);
            });
    });

    /**
     * @swagger
     * /requests/user/{userId}/status/{statusId}:
     *  get:
     *    summary: "Retrieves Travel Request that belongs to a user by a request status id"
     *    description: "Retrieves Travel Request by specifying the user id and the status id. e.g Say we want to
     *                    retrieve a travel request that belongs to UserA and is Approved, this route a perfect fit
     *                    for such."
     *    tags: ['Travel Request']
     *    produces:
     *    - application/json
     *    operationId: "getRequestByUserAndStatus"
     *    responses:
     *      '200':
     *        description: 'Returns a list of Travel Request Object'
     *        schema:
     *          type: array
     *          items:
     *            $ref: '#/definitions/getRequestOutput'
     *    parameters:
     *      - $ref: '#/parameters/sessionId'
     *      - $ref: '#/parameters/usr_id'
     *      - $ref: '#/parameters/req_status'
     */
    app.get('/requests/user/:userId/status/:statusId', urlencodedParser, (req, res)=> {
        return res.send("Not yet implemented");
        // API.travels().getTravelRequests({user_id:req.param("userId"), status:req.param("statusId")}, undefined, req.who)
        //     .then(({data, code})=>{
        //         return res.status(code).send(data);
        //     })
        //     .catch(({err, code})=>{
        //         return res.status(code).send(err);
        //     });
    });


    /**
     * @swagger
     * /requests/user/{userId}/{offset}/{limit}:
     *  get:
     *    description: 'Retrieves a list of Travel Request that belongs to a particular
     *          user as specified by the userId path parameter'
     *    summary: 'Retrieves Travel Request belonging to a User'
     *    tags: ['Travel Request']
     *    produces:
     *    - application/json
     *    operationId: "getRequestByUser"
     *    responses:
     *      '200':
     *        description: "A list of Travel Request"
     *        schema:
     *          $ref: '#/definitions/getRequestOutput'
     *    parameters:
     *    - $ref: '#/parameters/sessionId'
     *    - $ref: '#/parameters/usr_id'
     *    - $ref: '#/parameters/offset'
     *    - $ref: '#/parameters/limit'
     */
    app.get('/requests/user/:id/:offset?/:limit?', urlencodedParser, (req, res)=> {
        API.travels().getTravelRequests(req.params.id, "user_id", req.who, req.params.offset, req.params.limit)
            .then(({data, code})=> {
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                return res.status(code).send(err);
            });
    });


    /**
     * @swagger
     * /requests/{id}/status/{statusId}:
     *  put:
     *    summary: "Updates the status of a Travel Request"
     *    description: "This can be used to update a travel request to either of the following :
     *                    Approved, Pending or Rejected"
     *    tags: ['Travel Request']
     *    produces:
     *    - application/json
     *    operationId: "updateRequestStatus"
     *    responses:
     *      '200':
     *        description: 'The updated travel request'
     *        schema:
     *          $ref: '#/definitions/getRequestOutput'
     *    parameters:
     *    - $ref: '#/parameters/sessionId'
     *    - $ref: '#/parameters/req_id'
     *    - $ref: '#/parameters/req_status'
     */
    app.put('/requests/:id/status/:statusId', urlencodedParser, (req, res)=> {
        res.send("Not yet implemented");
    });

    /**
     * @swagger
     * /requests/{id}:
     *  delete:
     *    summary: Deletes a travel request
     *    description: "Deletes a travel request by the specified request {id}"
     *    tags: ['Travel Request']
     *    produces:
     *    - application/json
     *    operationId: deleteRequest
     *    responses:
     *      '200':
     *        description: Returns true with the id of the request deleted
     *    parameters:
     *    - $ref: '#/parameters/sessionId'
     *    - $ref: '#/parameters/req_id'
     */
    app.delete('/requests/:id', (req, res)=> {
        API.travels().deleteTravelRequest("id", req.params.id, req.who)
            .then(({data, code})=> {
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                return res.status(code).send(err);
            });
    });

};