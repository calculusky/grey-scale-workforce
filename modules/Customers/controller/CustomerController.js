/**
 * Created by paulex on 9/04/17.
 */

const Log = require(`${__dirname}/../../../core/logger`);
const RecognitionService = require('../../Users/model/services/RecognitionService');

module.exports.controller = function (app, {API, jsonParser, urlencodedParser}) {
    app.use('/customers', (req, res, next)=>API.recognitions().auth(req, res, next));

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
    app.post('/customers', jsonParser, (req, res)=> {
        console.log(req.body);
        API.customers().createCustomer(req.body, req.who)
            .then(({data, code})=> {
                console.log(data);
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                console.log(code, err);
                return res.status(code).send(err);
            });
    });

    /**
     * @swagger
     * /customers:
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
     *      - in: body
     *        name: 'customer'
     *        required: true
     *        schema:
     *          $ref: '#/definitions/postCustomerInput'
     */
    app.put('/customers', jsonParser, (req, res)=> {
        API.customers().updateCustomer(req.body, req.who)
            .then(({data, code})=> {
                console.log(data);
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                console.log(code, err);
                return res.status(code).send(err);
            });
    });


    // /**
    //  * @swagger
    //  * /customers/user/{user_id}/{offset}/{limit}:
    //  *   get:
    //  *     summary: Gets customers assigned to a user
    //  *     description: ''
    //  *     tags: [Customer]
    //  *     produces:
    //  *     - application/json
    //  *     operationId: getCustomers
    //  *     responses:
    //  *       '200':
    //  *         description: Successful
    //  *         schema:
    //  *           $ref: '#/definitions/getCustomerOutput'
    //  *     parameters:
    //  *     - $ref: '#/parameters/sessionId'
    //  *     - in: path
    //  *       name: user_id
    //  *       required: true
    //  *     - $ref: '#/parameters/offset'
    //  *     - $ref: '#/parameters/limit'
    //  */
    // app.get('/customers/user/:user_id/:offset?/:limit?', urlencodedParser, (req, res)=> {
    //     return API.customers().getCustomers(req.params['user_id'], "assigned_to", req.who, req.params.offset, req.params.limit)
    //         .then(({data, code})=> {
    //             return res.status(code).send(data);
    //         })
    //         .catch(({err, code})=> {
    //             return res.status(code).send(err);
    //         });
    // });


    /**
     * @swagger
     * /customers/{account_no}:
     *   get:
     *     summary: Gets List of customers By the account no
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
     *     - $ref: '#/parameters/account_no'
     */
    app.get('/customers/:account_no', urlencodedParser, (req, res)=> {
        return API.customers().getCustomers(req.params['account_no'])
            .then(({data, code})=> {
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                return res.status(code).send(err);
            });
    });

    /**
     * @swagger
     * /customers/meter/{meter_no}:
     *   get:
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
    app.get('/customers/meter/:meterNo', urlencodedParser, (req, res)=> {
        return API.customers().getCustomers(req.params['meterNo'], "meter_no")
            .then(({data, code})=> {
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                return res.status(code).send(err);
            });
    });


    /**
     * @swagger
     * /customers/search/{keyword}/{offset}/{limit}:
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
    app.get('/customers/search/:keyword/:offset(\\d+)?/:limit(\\d+)?', urlencodedParser, (req, res)=> {
        return API.customers().searchCustomers(req.params['keyword'], req.params['offset'], req.params['limit'])
            .then(({data, code})=> {
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                return res.status(code).send(err);
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
    app.delete('/customers/:account_no', urlencodedParser, (req, res)=> {
        API.customers().deleteCustomer("id", req.params.account_no)
            .then(({data, code})=> {
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                return res.status(code).send(err);
            });
    });
};