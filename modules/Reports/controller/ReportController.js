/**
 * Created by paulex on 10/09/17.
 */

const Log = require(`${__dirname}/../../../core/logger`);
const RecognitionService = require('../../Users/model/services/RecognitionService');

module.exports.controller = function (app, {API, jsonParser, urlencodedParser}) {
    app.use('/reports*', (req, res, next)=>API.recognitions().auth(req, res, next));
    
    /**
     * @swagger
     * /reports/{id}:
     *   get:
     *     summary: Get Report
     *     description: ''
     *     tags: [Reports]
     *     produces:
     *     - application/json
     *     operationId: getReports
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getReportOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - $ref: '#/parameters/payment_id'
     */
    app.get('/reports/:id', urlencodedParser, (req, res)=> {
        return API.reports().getReports(req.params['id'])
            .then(({data, code})=> {
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                return res.status(code).send(err);
            });
    });

    
};