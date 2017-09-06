/**
 * Created by paulex on 7/5/17.
 */
const RecognitionService = require('../../Users/model/services/RecognitionService');
module.exports.controller = function (app, {API, jsonParser, urlencodedParser}) {
    app.use('/work_orders*', (req, res, next)=>API.recognitions().auth(req, res, next));
    /**
     * @swagger
     * /work_orders:
     *  post:
     *    description: "Creates a new Work Order"
     *    summary: "Create a new Work Order"
     *    tags: ['Work Order']
     *    produces:
     *    - application/json
     *    operationId: postRequest
     *    responses:
     *      '200':
     *        description: Created Successfully
     *        schema:
     *          $ref: '#/definitions/postWorkOrderOutput'
     *    parameters:
     *    - $ref: '#/parameters/sessionId'
     *    - name: "work_order"
     *      in: body
     *      required: true
     *      schema:
     *        $ref: '#/definitions/postWorkOrderInput'
     */
    app.post('/work_orders', jsonParser, (req, res)=> {
        console.log(req.body);
        API.workOrders().createWorkOrder(req.body, req.who)
            .then(({data, code})=> {
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                return res.status(code).send(err);
            });
    });


    /**
     * @swagger
     * /work_orders/{id}:
     *   put:
     *     summary: "Update an existing work_order."
     *     description: "Update an already existing work_order"
     *     tags: ['Work Order']
     *     produces:
     *     - application/json
     *     operationId: "updateWorkOrder"
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/postWorkOrderOutput'
     *     parameters:
     *       - $ref: '#/parameters/sessionId'
     *       - $ref : '#/parameters/req_id'
     *       - name: 'work_order'
     *         in: body
     *         required: true
     *         schema:
     *           $ref: '#/definitions/postWorkOrderInput'
     */
    app.put('/work_orders/:id', jsonParser, (req, res)=> {
        res.send("Not yet implemented");
        // API.workOrders().getTravelRequests(req.body, req.who)
        //     .then(({data, code})=>{
        //         return res.status(code).send(data);
        //     })
        //     .catch(({err, code})=>{
        //         return res.status(code).send(err);
        //     });
    });


    /**
     * @swagger
     * /work_orders/{id}:
     *   get:
     *     description: "Returns a Specific Work Order by the given ID"
     *     summary: "Finds a Work Order by the given ID"
     *     tags: ['Work Order']
     *     consumes:
     *     - application/json
     *     produces:
     *     - application/json
     *     operationId: "getWorkOrder"
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getWorkOrderOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - name: id
     *       description: Work Order ID
     *       in: path
     *       required: true
     *       type: integer
     */
    app.get('/work_orders/:id', urlencodedParser, (req, res)=> {
        API.workOrders().getWorkOrders(req.params.id, undefined, req.who)
            .then(({data, code})=> {
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                return res.status(code).send(err);
            });
    });


    /**
     * @swagger
     * /work_orders/status/{statusId}/{offset}/{limit}:
     *  get:
     *    summary: "Retrieves a Work Order by status"
     *    description: "This can be used to retrieve work order based on their status conditions"
     *
     *    tags: ['Work Order']
     *    produces:
     *    - application/json
     *    operationId: "getRequestByStatus"
     *    responses:
     *      '200':
     *        description: A list of Work Order
     *        schema:
     *          type: array
     *          items:
     *            $ref: '#/definitions/getWorkOrderOutput'
     *    parameters:
     *      - $ref: '#/parameters/sessionId'
     *      - $ref: '#/parameters/req_status'
     *      - $ref: '#/parameters/offset'
     *      - $ref: '#/parameters/limit'
     */
    app.get('/work_orders/status/:statusId', urlencodedParser, (req, res)=> {
        API.workOrders().getWorkOrders(req.params['statusId'], "status", req.who)
            .then(({data, code})=> {
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                return res.status(code).send(err);
            });
    });


    /**
     * @swagger
     * /work_orders/{id}/status/{statusId}:
     *  get:
     *    summary: "Update a Work Order status"
     *    description: "This can be used to retrieve work order based on their status conditions"
     *
     *    tags: ['Work Order']
     *    produces:
     *    - application/json
     *    operationId: "getRequestByStatus"
     *    responses:
     *      '200':
     *        description: A list of Work Order
     *        schema:
     *          type: array
     *          items:
     *            $ref: '#/definitions/getWorkOrderOutput'
     *    parameters:
     *      - $ref: '#/parameters/sessionId'
     *      - $ref: '#/parameters/req_status'
     *      - $ref: '#/parameters/offset'
     *      - $ref: '#/parameters/limit'
     */
    app.put('/work_orders/:id/status/:statusId', urlencodedParser, (req, res)=> {
        API.workOrders().changeWorkOrderStatus(req.params['id'], req.params['statusId'])
            .then(({data, code})=> {
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                return res.status(code).send(err);
            });
    });

    /**
     * @swagger
     * /work_orders/user/{userId}/status/{statusId}:
     *  get:
     *    summary: "Retrieves Work Order that belongs to a user by a work_order status id"
     *    description: "Retrieves Work Order by specifying the user id and the status id. e.g Say we want to
     *                    retrieve a work_order that belongs to UserA and is Pending, this route a perfect fit
     *                    for such."
     *    tags: ['Work Order']
     *    produces:
     *    - application/json
     *    operationId: "getRequestByUserAndStatus"
     *    responses:
     *      '200':
     *        description: 'Returns a list of Work Order Object'
     *        schema:
     *          type: array
     *          items:
     *            $ref: '#/definitions/getWorkOrderOutput'
     *    parameters:
     *      - $ref: '#/parameters/sessionId'
     *      - $ref: '#/parameters/user_id'
     *      - $ref: '#/parameters/req_status'
     */
    app.get('/work_orders/user/:userId/status/:statusId', urlencodedParser, (req, res)=> {
        return res.send("Not yet implemented");
        // API.workOrders().getTravelRequests({user_id:req.param("userId"), status:req.param("statusId")}, undefined, req.who)
        //     .then(({data, code})=>{
        //         return res.status(code).send(data);
        //     })
        //     .catch(({err, code})=>{
        //         return res.status(code).send(err);
        //     });
    });


    /**
     * @swagger
     * /work_orders/user/{userId}/{offset}/{limit}:
     *  get:
     *    description: 'Retrieves a list of Work Order that belongs to a particular
     *          User as specified by the userId path parameter'
     *    summary: 'Retrieves Work Order Assigned to a User'
     *    tags: ['Work Order']
     *    produces:
     *    - application/json
     *    operationId: "getWorkOrderByUser"
     *    responses:
     *      '200':
     *        description: "A list of Work Order"
     *        schema:
     *          $ref: '#/definitions/getWorkOrderOutput'
     *    parameters:
     *    - $ref: '#/parameters/sessionId'
     *    - $ref: '#/parameters/user_id'
     *    - $ref: '#/parameters/offset'
     *    - $ref: '#/parameters/limit'
     */
    app.get('/work_orders/user/:userId/:offset?/:limit?', urlencodedParser, (req, res)=> {
        console.log(req.params);
        API.workOrders().getWorkOrders(`{"id":${req.params['userId']}}`, "assigned_to->[]", req.who, req.params.offset, req.params.limit)
            .then(({data, code})=> {
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                return res.status(code).send(err);
            });
    });


    /**
     * @swagger
     * /work_orders/{id}/status/{statusId}:
     *  put:
     *    summary: "Updates the status of a Work Order"
     *    description: "This can be used to update a  work_order to either of the following :
     *                    Approved, Pending or Rejected"
     *    tags: ['Work Order']
     *    produces:
     *    - application/json
     *    operationId: "updateRequestStatus"
     *    responses:
     *      '200':
     *        description: 'The updated  work_order'
     *        schema:
     *          $ref: '#/definitions/getWorkOrderOutput'
     *    parameters:
     *    - $ref: '#/parameters/sessionId'
     *    - $ref: '#/parameters/req_id'
     *    - $ref: '#/parameters/req_status'
     */
    app.put('/work_orders/:id/status/:statusId', urlencodedParser, (req, res)=> {
        res.send("Not yet implemented");
    });

    /**
     * @swagger
     * /work_orders/{id}:
     *  delete:
     *    summary: Deletes a Work Order
     *    description: "Deletes a Work Order by the specified Work Order {id}"
     *    tags: ['Work Order']
     *    produces:
     *    - application/json
     *    operationId: deleteWorkOrder
     *    responses:
     *      '200':
     *        description: Returns true with the id of the Work Order deleted
     *    parameters:
     *    - $ref: '#/parameters/sessionId'
     *    - $ref: '#/parameters/req_id'
     */
    app.delete('/work_orders/:id', (req, res)=> {
        API.workOrders().deleteWorkOrder("id", req.params.id, req.who)
            .then(({data, code})=> {
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                return res.status(code).send(err);
            });
    });

};