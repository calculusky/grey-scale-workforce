/**
 * Created by paulex on 7/5/17.
 */
/**
 *
 * @param app
 * @param API {API}
 * @param jsonParser
 * @param urlencodedParser
 */
module.exports.controller = function (app, {API, jsonParser, urlencodedParser, multiPart}) {
    app.use('/work_orders*', (req, res, next) => API.recognitions().auth(req, res, next));

    /**
     * @swagger
     * /work_orders:
     *  post:
     *    description: "Create Work Order"
     *    summary: "Create a new Work Order"
     *    tags: ['Work Orders']
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
    app.post('/work_orders', jsonParser, (req, res) => {
        API.workOrders().createWorkOrder(req.body, req.who)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });


    /**
     * @swagger
     * /work_orders/{id}:
     *   put:
     *     summary: "Update Work Order"
     *     description: "Update an already existing work order"
     *     tags: ['Work Orders']
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
     *       - $ref : '#/parameters/work_order_id'
     *       - name: 'work_order'
     *         in: body
     *         required: true
     *         schema:
     *           $ref: '#/definitions/postWorkOrderInput'
     */
    app.put('/work_orders/:id', multiPart.array("files"), (req, res) => {
        API.workOrders().updateWorkOrder('id', req.params['id'], req.body, req.who, req.files, API)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });

    //user/:userId/:fromDate/:toDate/:offset(\d+)?/:limit(\d+)?
    /**
     * @swagger
     * /work_orders:
     *   get:
     *     description: "Returns a list of work orders"
     *     tags: ['Work Orders']
     *     consumes:
     *     - application/json
     *     produces:
     *     - application/json
     *     operationId: "getWorkOrdersBetweenDates"
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getWorkOrderOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - $ref: '#/parameters/user_id'
     *     - $ref: '#/parameters/fromDate'
     *     - $ref: '#/parameters/toDate'
     *     - $ref: '#/parameters/offset'
     *     - $ref: '#/parameters/limit'
     */
    app.get('/work_orders', urlencodedParser, (req, res) => {
        console.log(req.query);
        API.workOrders().getWorkOrders(req.query, req.who).then(({data, code}) => {
            return res.status(code).send(data);
        }).catch(({err, code}) => {
            return res.status(code).send(err);
        });
    });

    /**
     * @swagger
     * /work_orders/{id}:
     *   get:
     *     description: "Returns a Specific Work Order by the given ID"
     *     summary: "Fetch Work Order"
     *     tags: ['Work Orders']
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
     *     - $ref: '#/parameters/work_order_id'
     */
    app.get('/work_orders/:id', urlencodedParser, (req, res) => {
        console.log("/work_orders/:id");
        API.workOrders().getWorkOrder(req.params.id, undefined, req.who)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });


    /**
     * @swagger
     * /work_orders/{id}/material_requisition:
     *   get:
     *     description: "Returns Material Requisitions of this work order"
     *     summary: "Fetch Work Order"
     *     tags: ['Work Orders']
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
     *     - $ref: '#/parameters/work_order_id'
     */
    app.get('/work_orders/:id/material_requisitions', urlencodedParser, (req, res) => {
        API.workOrders().getWorkOrderMaterialRequisitions(req.params.id, req.query, req.who)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });

    /**
     * @swagger
     * /work_orders/{id}/status/{statusId}:
     *  put:
     *    summary: "Update Work Order Status"
     *    description: "This can be used to retrieve work order based on their status conditions"
     *
     *    tags: ['Work Orders']
     *    produces:
     *    - application/json
     *    operationId: "updateWorkOrderStatus"
     *    responses:
     *      '200':
     *        description: A list of Work Order
     *        schema:
     *          type: array
     *          items:
     *            $ref: '#/definitions/getWorkOrderOutput'
     *    parameters:
     *      - $ref: '#/parameters/sessionId'
     *      - $ref: '#/parameters/statusId'
     *      - $ref: '#/parameters/offset'
     *      - $ref: '#/parameters/limit'
     */
    app.put('/work_orders/:id/status/:statusId', urlencodedParser, (req, res) => {
        API.workOrders().changeWorkOrderStatus(req.params['id'], req.params['statusId'])
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });


    /**
     * @swagger
     * /work_orders/{id}/notes/{offset}/{limit}:
     *   get:
     *     summary: "List Work Order Notes"
     *     description: ''
     *     tags: [Work Orders]
     *     produces:
     *     - application/json
     *     operationId: getWorkOrderNotes
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getNoteOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - $ref: '#/parameters/work_order_id'
     *     - $ref: '#/parameters/offset'
     *     - $ref: '#/parameters/limit'
     */
    app.get('/work_orders/:id/notes', urlencodedParser, (req, res) => {
        console.log("Fetch note");
        return API.notes().getNotes(req.params['id'], "work_orders", "relation_id", req.who, req.query.offset || 0, req.query.limit || 10)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
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
     *    tags: ['Work Orders']
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
     *    - $ref: '#/parameters/work_order_id'
     *    - $ref: '#/parameters/statusId'
     */
    app.put('/work_orders/:id/status/:statusId', urlencodedParser, (req, res) => {
        res.send("Not yet implemented");
    });

    /**
     * @swagger
     * /work_orders/{id}:
     *  delete:
     *    summary: Deletes a Work Order
     *    description: "Deletes a Work Order by the specified Work Order {id}"
     *    tags: ['Work Orders']
     *    produces:
     *    - application/json
     *    operationId: deleteWorkOrder
     *    responses:
     *      '200':
     *        description: Returns true with the id of the Work Order deleted
     *    parameters:
     *    - $ref: '#/parameters/sessionId'
     *    - $ref: '#/parameters/work_order_id'
     */
    app.delete('/work_orders/:id', (req, res) => {
        API.workOrders().deleteWorkOrder("id", req.params.id, req.who)
            .then(({data, code}) => {
                return res.status(code).send(data);
            }).catch(({err, code}) => {
            return res.status(code).send(err);
        });
    });

};