/**
 * Created by paulex on 10/09/17.
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
    app.use('/payments', (req, res, next)=>API.recognitions().auth(req, res, next));


    /**
     * @swagger
     * /payments:
     *   post:
     *     summary: Make Payment
     *     description: ''
     *     tags: [Payments]
     *     produces:
     *     - application/json
     *     operationId: makePayments
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/postPaymentInput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - name: "payment"
     *       in: body
     *       required: true
     *       schema:
     *         $ref: '#/definitions/postPaymentInput'
     */
    app.post('/payments', jsonParser, (req, res)=> {
        return API.payments().createPayment(req.body, req.who, API)
            .then(({data, code})=> {
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                return res.status(code).send(err);
            });
    });


    /**
     * @swagger
     * /payments/{id}:
     *   get:
     *     summary: Get Payment
     *     description: ''
     *     tags: [Payments]
     *     produces:
     *     - application/json
     *     operationId: getPayments
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getPaymentOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - $ref: '#/parameters/payment_id'
     */
    app.get('/payments/:id', urlencodedParser, (req, res)=> {
        return API.payments().getPayments(req.params['id'])
            .then(({data, code})=> {
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                return res.status(code).send(err);
            });
    });


    // /**
    //  * @swagger
    //  * /payments/search/{keyword}/{offset}/{limit}:
    //  *   get:
    //  *     summary: Search for a payment either by the account_no or meter_no
    //  *     description: ''
    //  *     tags: [Payments]
    //  *     produces:
    //  *     - application/json
    //  *     operationId: searchPayments
    //  *     responses:
    //  *       '200':
    //  *         description: Successful
    //  *         schema:
    //  *           $ref: '#/definitions/getPaymentOutput'
    //  *     parameters:
    //  *     - $ref: '#/parameters/sessionId'
    //  *     - $ref: '#/parameters/keyword'
    //  *     - $ref: '#/parameters/offset'
    //  *     - $ref: '#/parameters/limit'
    //  */
    // app.get('/payments/search/:keyword/:offset(\\d+)?/:limit(\\d+)?', urlencodedParser, (req, res)=> {
    //     return API.payments().searchPayments(req.params['keyword'], req.params['offset'], req.params['limit'])
    //         .then(({data, code})=> {
    //             return res.status(code).send(data);
    //         })
    //         .catch(({err, code})=> {
    //             return res.status(code).send(err);
    //         });
    // });

    /**
     * @swagger
     * /payments/{id}:
     *  delete:
     *    summary: Deletes a Payment
     *    description: "Deletes a Payment"
     *    tags: [Payments]
     *    produces:
     *    - application/json
     *    operationId: deletePayment
     *    responses:
     *      '200':
     *        description: Returns true with the id of the request deleted
     *    parameters:
     *    - $ref: '#/parameters/sessionId'
     *    - $ref: '#/parameters/payment_id'
     */
    app.delete('/payments/:id', urlencodedParser, (req, res)=> {
        API.payments().deletePayment("id", req.params.id)
            .then(({data, code})=> {
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                return res.status(code).send(err);
            });
    });
};