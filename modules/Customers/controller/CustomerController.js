/**
 * Created by paulex on 9/04/17.
 */

/**
 *
 * @param app
 * @param API {API}
 * @param jsonParser
 * @param urlencodedParser
 */
module.exports.controller = function (app, {API, jsonParser, urlencodedParser}) {
    app.use('/customers', (req, res, next) => API.recognitions().auth(req, res, next));

    /**
     * @swagger
     * /customers:
     *   post:
     *     summary: Creates a Customer
     *     description: ''
     *     tags: [Customers]
     *     consumes:
     *     - application/json
     *     produces:
     *     - application/json
     *     operationId: createCustomer
     *     responses:
     *       '200':
     *         description: Successfully Added
     *     parameters:
     *      - $ref: '#/parameters/sessionId'
     *      - in: body
     *        name: 'customer'
     *        required: true
     *        schema:
     *          $ref: '#/definitions/postCustomerInput'
     */
    app.post('/customers', jsonParser, (req, res) => {
        console.log(req.body);
        API.customers().createCustomer(req.body, req.who)
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
     * /customers/{account_no}:
     *   put:
     *     summary: Updates a Customer
     *     description: ''
     *     tags: [Customers]
     *     consumes:
     *     - application/json
     *     produces:
     *     - application/json
     *     operationId: updateCustomer
     *     responses:
     *       '200':
     *         description: Successfully Added
     *     parameters:
     *      - $ref: '#/parameters/sessionId'
     *      - $ref: '#/parameters/account_no'
     *      - in: body
     *        name: 'customer'
     *        required: true
     *        schema:
     *          $ref: '#/definitions/postCustomerInput'
     */
    app.put('/customers/:id', jsonParser, (req, res) => {
        API.customers().updateCustomer("account_no", req.params['id'], req.body, req.who, API).then(({data, code}) => {
            console.log(data);
            return res.status(code).send(data);
        }).catch(({err, code}) => {
            console.log(code, err);
            return res.status(code).send(err);
        });
    });


    /**
     * @swagger
     * /customers/{account_no}:
     *   get:
     *     summary: Gets List of customers By the account no
     *     description: ''
     *     tags: [Customers]
     *     produces:
     *     - application/json
     *     operationId: getCustomer
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getCustomerOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - $ref: '#/parameters/account_no'
     */
    app.get('/customers/:account_no', urlencodedParser, (req, res) => {
        return API.customers().getCustomer(req.params['account_no'])
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });

    /**
     * @swagger
     * /customers/meter/{meter_no}:
     *   get:
     *     deprecated: true
     *     summary: Gets List of customers by meter
     *     description: ''
     *     tags: [Customers]
     *     produces:
     *     - application/json
     *     operationId: getCustomersByMeterNo
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getCustomerOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - $ref: '#/parameters/meter_no'
     */
    app.get('/customers/meter/:meterNo', urlencodedParser, (req, res) => {
        return API.customers().getCustomer(req.params['meterNo'], "meter_no")
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });

    /**
     * @swagger
     * /customers:
     *   get:
     *     summary: Queries for a list of customers
     *     description: ''
     *     tags: [Customers]
     *     produces:
     *     - application/json
     *     operationId: getCustomers
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getCustomerOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - $ref: '#/parameters/meter_no'
     */
    app.get('/customers', urlencodedParser, (req, res) => {
        return API.customers().getCustomers(req.query, req.who)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });


    /**
     * @swagger
     * /customers/search/{keyword}:
     *   get:
     *     summary: Search for a customer either by the account_no or meter_no
     *     description: ''
     *     tags: [Customers]
     *     produces:
     *     - application/json
     *     operationId: searchCustomers
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
    app.get('/customers/search/:keyword', urlencodedParser, (req, res) => {
        return API.customers().searchCustomers(req.params['keyword'], req.query['offset'], req.query['limit'])
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });

    /**
     * @swagger
     * /customers/{account_no}/workorders:
     *   get:
     *     summary: Gets a work orders that have a level of relationship with customers
     *     description: ''
     *     tags: [Customers]
     *     produces:
     *     - application/json
     *     operationId: getCustomerWorkOrders
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getWorkOrderOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - $ref: '#/parameters/account_no'
     */
    app.get('/customers/:account_no/work_orders', urlencodedParser, (req, res) => {
        return API.customers().getCustomerWorkOrders(req.params['account_no'], req.who)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });

    /**
     * @swagger
     * /customers/data-tables/records:
     *  get:
     *   description: "Get customers record for data-tables"
     *   summary: "Update a User"
     *   tags: [Customers]
     *   produces:
     *   - application/json
     *   operationId: getCustomerTableRecords
     *   responses:
     *     '200':
     *       description: "Customer"
     *       schema:
     *         type: array
     *         items:
     *           $ref: '#/definitions/getDataTablesOutput'
     *   parameters:
     *     - $ref: '#/parameters/sessionId'
     */
    app.get("/customers/data-tables/records", (req, res) => {
        API.customers().getCustomerTableRecords(req.query, req.who).then(data => {
            console.log(data);
            return res.send(JSON.stringify(data));
        }).catch(err => {
            console.error('err', err);
            return res.status(500).send(err);
        });
    });


    /**
     * @swagger
     * /customers/{account_no}:
     *  delete:
     *    summary: Deletes a Customer
     *    description: "Deletes a Customer"
     *    tags: [Customers]
     *    produces:
     *    - application/json
     *    operationId: deleteCustomer
     *    responses:
     *      '200':
     *        description: Returns true with the id of the request deleted
     *    parameters:
     *    - $ref: '#/parameters/sessionId'
     *    - $ref: '#/parameters/account_no'
     */
    app.delete('/customers/:account_no', urlencodedParser, (req, res) => {
        API.customers().deleteCustomer("id", req.params.account_no, req.who)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });
};