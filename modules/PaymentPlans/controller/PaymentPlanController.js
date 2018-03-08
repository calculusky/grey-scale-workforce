/**
 * Created by paulex on 8/22/17.
 */

const Log = require(`${__dirname}/../../../core/logger`);
const RecognitionService = require('../../Users/model/services/RecognitionService');

/**
 *
 * @param app
 * @param API {API}
 * @param jsonParser
 * @param urlencodedParser
 */
module.exports.controller = function (app, {API, jsonParser, urlencodedParser}) {
    app.use('/payment_plans*', (req, res, next) => API.recognitions().auth(req, res, next));

    /**
     * @swagger
     * /payment_plans:
     *   post:
     *     summary: Creates an PaymentPlan
     *     description: ''
     *     tags: [PaymentPlans]
     *     consumes:
     *     - application/json
     *     produces:
     *     - application/json
     *     operationId: createPaymentPlan
     *     responses:
     *       '200':
     *         description: Successfully Added
     *     parameters:
     *      - $ref: '#/parameters/sessionId'
     *      - in: body
     *        name: 'asset'
     *        required: true
     *        schema:
     *          $ref: '#/definitions/postPaymentPlanInput'
     */
    app.post('/payment_plans', jsonParser, (req, res) => {
        console.log(req.body);
        API.paymentPlans().createPaymentPlan(req.body, req.who)
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
     * /payment_plans:
     *   put:
     *     summary: Updates a PaymentPlan
     *     description: ''
     *     tags: [PaymentPlans]
     *     consumes:
     *     - application/json
     *     produces:
     *     - application/json
     *     operationId: updatePaymentPlan
     *     responses:
     *       '200':
     *         description: Successfully Added
     *     parameters:
     *      - $ref: '#/parameters/sessionId'
     *      - in: body
     *        name: 'asset'
     *        required: true
     *        schema:
     *          $ref: '#/definitions/postPaymentPlanInput'
     */
    app.put('/payment_plans', jsonParser, (req, res) => {
        API.paymentPlans().updatePaymentPlan(req.body, req.who)
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
     * /payment_plans/user/{user_id}/{offset}/{limit}:
     *   get:
     *     summary: Gets payment_plans assigned to a user
     *     description: ''
     *     tags: [PaymentPlans]
     *     produces:
     *     - application/json
     *     operationId: getPaymentPlansByUser
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getPaymentPlanOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - $ref: '#/parameters/user_id'
     *     - $ref: '#/parameters/offset'
     *     - $ref: '#/parameters/limit'
     */
    app.get('/payment_plans/user/:user_id/:offset?/:limit?', urlencodedParser, (req, res) => {
        return API.paymentPlans().getPaymentPlans(req.params['user_id'], "assigned_to", req.who, req.params.offset, req.params.limit)
            .then(({data, code})=> {
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                return res.status(code).send(err);
            });
    });


    /**
     * @swagger
     * /payment_plans/{offset}/{limit}:
     *   get:
     *     summary: Retrieves a List of payment_plans
     *     description: ''
     *     tags: [PaymentPlans]
     *     produces:
     *     - application/json
     *     operationId: getPaymentPlans
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getPaymentPlanOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - $ref: '#/parameters/offset'
     *     - $ref: '#/parameters/limit'
     */
    app.get('/payment_plans/:offset?/:limit?', urlencodedParser, (req, res) => {
        console.log('/payment_plans/offset/limit');
        return API.paymentPlans().getPaymentPlans({}, undefined, req.who, req.params.offset || 0, req.params.limit || 10)
            .then(({data, code})=> {
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                return res.status(code).send(err);
            });
    });


    /**
     * @swagger
     * /payment_plans/{id}:
     *   get:
     *     summary: Retrieves a Single PaymentPlan
     *     description: ''
     *     tags: [PaymentPlans]
     *     produces:
     *     - application/json
     *     operationId: getPaymentPlan
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getPaymentPlanOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - $ref: '#/parameters/asset_id'
     */
    app.get('/payment_plans/:id', urlencodedParser, (req, res) => {
        return API.paymentPlans().getPaymentPlans(req.params['id'], undefined, req.who)
            .then(({data, code})=> {
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                return res.status(code).send(err);
            });
    });

    /**
     * @swagger
     * /payment_plans/search/{keyword}/{offset}/{limit}:
     *   get:
     *     summary: Search for a asset either by the PaymentPlan Name or by an PaymentPlan Type
     *     description: ''
     *     tags: [PaymentPlans]
     *     produces:
     *     - application/json
     *     operationId: searchPaymentPlans
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
    app.get('/payment_plans/search/:keyword/:offset?/:limit?', urlencodedParser, (req, res) => {
        console.log('/payment_plans/search/keyword');
        return API.paymentPlans().searchPaymentPlans(req.params['keyword'])
            .then(({data, code})=> {
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                return res.status(code).send(err);
            });
    });

    /**
     * @swagger
     * /payment_plans/{id}:
     *  delete:
     *    summary: Deletes a PaymentPlan
     *    description: "Deletes a PaymentPlan"
     *    tags: [PaymentPlans]
     *    produces:
     *    - application/json
     *    operationId: deletePaymentPlan
     *    responses:
     *      '200':
     *        description: Returns true with the id of the request deleted
     *    parameters:
     *    - $ref: '#/parameters/sessionId'
     *    - $ref: '#/parameters/asset_id'
     */
    app.delete('/payment_plans/:id', urlencodedParser, (req, res) => {
        API.paymentPlans().deletePaymentPlan("id", req.params.id)
            .then(({data, code})=> {
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                return res.status(code).send(err);
            });
    });
};