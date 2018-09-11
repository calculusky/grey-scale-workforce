/**
 * Created by paulex on 10/09/17.
 */


/**
 *
 * @param app
 * @param API {API}
 * @param jsonParser
 * @param urlencodedParser
 */
module.exports.controller = function (app, {API, jsonParser, urlencodedParser}) {
    // app.use('/reports*', (req, res, next)=>API.recognitions().auth(req, res, next));

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
    app.get('/reports/:id', urlencodedParser, (req, res) => {
        return API.reports().getReports(req.params['id'])
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });

    /**
     * @swagger
     * /reports/{module}/{report_time}:
     *   get:
     *     summary: Get work order report
     *     description: 'Retrieve numbers of work order record within the past time'
     *     tags: [Reports]
     *     produces:
     *     - application/json
     *     operationId: getModuleRecordCount
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getModuleRecordCountOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - $ref: '#/parameters/report_time'
     */
    app.get('/reports/:module/:time', urlencodedParser, (req, res) => {
        return API.reports().getModuleRecordCountFromTime(req.params['module'], req.params['time'])
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });


    /**
     * @swagger
     * /reports/payments/total_amount:
     *   get:
     *     summary: Get work order report
     *     description: 'Retrieve numbers of work order record within the past time'
     *     tags: [Reports]
     *     produces:
     *     - application/json
     *     operationId: getModuleRecordCount
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getModuleRecordCountOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - $ref: '#/parameters/report_time'
     */
    app.get('/reports/payments/total_amount', urlencodedParser, (req, res) => {
        return API.reports().getTotalAmountReceivedReport()
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });

    app.get('/reports/dashboard_basic', urlencodedParser, (req, res) => {
        return API.reports().getBasicDashboard()
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });

};