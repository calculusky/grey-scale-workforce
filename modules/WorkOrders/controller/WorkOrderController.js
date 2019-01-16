/**
 * Created by paulex on 7/5/17.
 */
/**
 *
 * @param app
 * @param API {API}
 * @param jsonParser
 * @param urlencodedParser
 * @param multiPart
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
    app.post('/work_orders', [multiPart.array("files"), jsonParser], (req, res) => {
        console.log(req.body);
        API.workOrders().createWorkOrder(req.body, req.who, req.files, API)
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
    app.put('/work_orders/:id', [multiPart.array("files"), jsonParser], (req, res) => {
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
     *     operationId: "getWorkOrders"
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getWorkOrderOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - $ref: '#/parameters/fromDate'
     *     - $ref: '#/parameters/toDate'
     *     - $ref: '#/parameters/workOrderInclude'
     */
    app.get('/work_orders', urlencodedParser, (req, res) => {
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
    app.get('/work_orders/:id', urlencodedParser, (req, res, next) => {
        if (req.params.id === 'export') return next();
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
     * /work_orders/search/{keyword}:
     *   get:
     *     deprecated: Use /work_orders?work_order_no=ff...
     *     summary: Search for a work order
     *     description: ''
     *     tags: ['Work Orders']
     *     produces:
     *     - application/json
     *     operationId: searchWorkOrders
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getWorkOrderOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - $ref: '#/parameters/keyword'
     *     - $ref: '#/parameters/offset'
     *     - $ref: '#/parameters/limit'
     */
    app.get('/work_orders/search/:keyword', urlencodedParser, (req, res) => {
        console.log('/work_orders/search/keyword');
        return API.workOrders().searchWorkOrders(req.params['keyword'], req.query['offset'], req.query['limit'])
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
    app.put('/work_orders/:id/status/:statusId', multiPart.array("files", 10), (req, res) => {
        let {id, statusId} = req.params;
        API.workOrders().changeWorkOrderStatus(id, statusId, req.who, req.body, req.files, API)
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
        return API.notes().getNotes(req.params['id'], "work_orders", "relation_id", req.who, req.query.offset || 0, req.query.limit || 10)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                res.set("Connection", "close");
                return res.status(code).send(err);
            });
    });

    /**
     * @swagger
     * /work_orders/export:
     *   get:
     *     summary: "Export Work Orders to Excel(xlsx)"
     *     description: ''
     *     tags: [Work Orders]
     *     produces:
     *     - application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
     *     operationId: exportWorkOrders
     *     responses:
     *       '200':
     *         description: An Excel Document
     *         content:
     *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
     *             schema:
     *               type: string
     *               format: binary
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - $ref: '#/parameters/workOrderType'
     *     - $ref: '#/parameters/exportWith'
     */
    app.get('/work_orders/export', urlencodedParser, (req, res) => {
        return API.workOrders().exportWorkOrders(req.query, req.who, API).then(workBook=>{
            res.setHeader('Content-disposition', 'attachment; filename=' + workBook['subject'] || "mrworking_export.xlsx");
            res.setHeader('Content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            return workBook.xlsx.write(res);
        }).catch(({err, code}) => {
            res.set("Connection", "close");
            return res.status(code).send(err);
        });
    });

    /**
     * @swagger
     * /work_orders/data-tables/records:
     *  get:
     *   description: "Get work_orders record for data-tables"
     *   summary: "Get work orders records for data-tables"
     *   tags: [Work Orders]
     *   produces:
     *   - application/json
     *   operationId: getWorkOrderDataTableRecords
     *   responses:
     *     '200':
     *       description: "WorkOrder"
     *       schema:
     *         type: array
     *         items:
     *           $ref: '#/definitions/getDataTablesOutput'
     *   parameters:
     *     - $ref: '#/parameters/sessionId'
     */
    app.get("/work_orders/data-tables/records", (req, res) => {
        API.workOrders().getWorkDataTableRecords(req.query, req.who).then(data => {
            console.log(data);
            return res.send(JSON.stringify(data));
        }).catch(err => {
            console.error('err', err);
            return res.status(500).send(err);
        });
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
     *    - $ref: '#/parameters/work_   order_id'
     */
    app.delete('/work_orders/:id', (req, res) => {
        API.workOrders().deleteWorkOrder("id", req.params.id, req.who)
            .then(({data, code}) => {
                return res.status(code).send(data);
            }).catch(({err, code}) => {
            return res.status(code).send(err);
        });
    });

    /**
     * @swagger
     * /work_orders:
     *  patch:
     *    summary: Updates multiple work orders
     *    description: "Updates multiple work orders"
     *    tags: ['Work Orders']
     *    produces:
     *    - application/json
     *    operationId: deleteWorkOrder
     *    responses:
     *      '200':
     *        description: Returns true with the id of the Work Order deleted
     *    parameters:
     *    - name: 'work_order'
     *      in: body
     *      required: true
     *      schema:
     *        $ref: '#/definitions/patchWorkOrderMultipleUpdateInput'
     */
    app.patch('/work_orders', (req, res) => {
        API.workOrders().updateMultipleWorkOrders(req.body, req.who)
            .then(({data, code}) => {
                return res.status(code).send(data);
            }).catch(({err, code}) => {
            return res.status(code).send(err);
        });
    });


    /**
     * @swagger
     * /work_orders/delete:
     *  patch:
     *    summary: Deletes multiple work orders
     *    description: "Deletes multiple work orders"
     *    tags: ['Work Orders']
     *    produces:
     *    - application/json
     *    operationId: deleteWorkOrder
     *    responses:
     *      '200':
     *        description: Returns true with the id of the Work Order deleted
     *    parameters:
     *    - $ref: '#/parameters/sessionId'
     */
    app.patch('/work_orders/delete', (req, res) => {
        API.workOrders().deleteMultipleWorkOrder(req.body, req.who)
            .then(({data, code}) => {
                return res.status(code).send(data);
            }).catch(({err, code}) => {
            return res.status(code).send(err);
        });
    });

};