/**
 * Created by paulex on 9/04/17.
 */

const Log = require(`${__dirname}/../../../core/logger`);
const RecognitionService = require('../../Users/model/services/RecognitionService');

module.exports.controller = function (app, {API, jsonParser, urlencodedParser, multiPart}) {
    app.use('/meter_readings*', (req, res, next)=>API.recognitions().auth(req, res, next));

    /**
     * @swagger
     * /meter_readings:
     *   post:
     *     summary: Creates a MeterReading
     *     description: ''
     *     tags: [Meter Readings]
     *     consumes:
     *     - application/json
     *     produces:
     *     - application/json
     *     operationId: createMeterReading
     *     responses:
     *       '200':
     *         description: Successfully Added
     *     parameters:
     *      - $ref: '#/parameters/sessionId'
     *      - in: body
     *        name: 'fault'
     *        required: true
     *        schema:
     *          $ref: '#/definitions/postMeterReadingInput'
     */
    app.post('/meter_readings', multiPart.array('files', 4), (req, res)=> {
        API.meter_readings().createMeterReading(req.body, req.who, req.files, API)
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
     * /meter_readings/spot_bill:
     *   post:
     *     summary: Generates Bill for a customer
     *     description: 'Generates bill for a customer based on the current meter reading'
     *     tags: [Meter Readings]
     *     consumes:
     *     - application/json
     *     produces:
     *     - application/json
     *     operationId: generateBill
     *     responses:
     *       '200':
     *         description: Bill Generated Successfully
     *     parameters:
     *      - $ref: '#/parameters/sessionId'
     *      - in: body
     *        name: 'meter_reading'
     *        required: true
     *        schema:
     *          $ref: '#/definitions/postSpotBillingInput'
     */
    app.post('/meter_readings/spot_bill', multiPart.array('files', 4), (req, res)=> {
        console.log(req.body);
        API.meter_readings().generateBill(req.body, req.who, req.files, API)
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
     * /meter_readings:
     *   put:
     *     summary: Updates a MeterReading
     *     description: ''
     *     tags: [Meter Readings]
     *     consumes:
     *     - application/json
     *     produces:
     *     - application/json
     *     operationId: updateMeterReading
     *     responses:
     *       '200':
     *         description: Successfully Added
     *     parameters:
     *      - $ref: '#/parameters/sessionId'
     *      - in: body
     *        name: 'fault'
     *        required: true
     *        schema:
     *          $ref: '#/definitions/postMeterReadingInput'
     */
    app.put('/meter_readings', jsonParser, (req, res)=> {
        API.meter_readings().updateMeterReading(req.body, req.who)
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
     * /meter_readings/{id}:
     *   get:
     *     summary: Get a Single Meter Reading
     *     description: ''
     *     tags: [Meter Readings]
     *     produces:
     *     - application/json
     *     operationId: getMeterReadings
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getMeterReadingOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - $ref: '#/parameters/meter_reading_id'
     */
    app.get('/meter_readings/:id', urlencodedParser, (req, res)=> {
        return API.meter_readings().getMeterReadings(req.params['id'], "id")
            .then(({data, code})=> {
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                return res.status(code).send(err);
            });
    });


    /**
     * @swagger
     * /meter_readings/meter/{meter_no}/last:
     *   get:
     *     summary: Get the last meter reading
     *     description: ''
     *     tags: [Meter Readings]
     *     produces:
     *     - application/json
     *     operationId: getMeterReadings
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getLastMeterReadingOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - $ref: '#/parameters/meter_no'
     */
    app.get('/meter_readings/meter/:meter_no/last', urlencodedParser, (req, res)=> {
        return API.meter_readings().getLastMeterReading(req.params['meter_no'], req.who)
            .then(({data, code})=> {
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                return res.status(code).send(err);
            });
    });

    /**
     * @swagger
     * /meter_readings/meter/{meter_no}/{offset}/{limit}:
     *   get:
     *     summary: Gets List of meter_readings by the meter no
     *     description: ''
     *     tags: [Meter Readings]
     *     produces:
     *     - application/json
     *     operationId: getMeterReadings
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getMeterReadingOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - $ref: '#/parameters/meter_no'
     *     - $ref: '#/parameters/offset'
     *     - $ref: '#/parameters/limit'
     */
    app.get('/meter_readings/meter/:meterNo/:offset?/:limit?', urlencodedParser, (req, res)=> {
        return API.meter_readings().getMeterReadings(req.params['meterNo'], "meter_no", req.who, req.params.offset || 0, req.params.limit || 10)
            .then(({data, code})=> {
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                return res.status(code).send(err);
            });
    });

    /**
     * @swagger
     * /meter_readings/{id}:
     *  delete:
     *    summary: Deletes a MeterReading
     *    description: "Deletes a MeterReading"
     *    tags: [Meter Readings]
     *    produces:
     *    - application/json
     *    operationId: deleteMeterReading
     *    responses:
     *      '200':
     *        description: Returns true with the id of the request deleted
     *    parameters:
     *    - $ref: '#/parameters/sessionId'
     *    - $ref: '#/parameters/meter_reading_id'
     */
    app.delete('/meter_readings/:id', urlencodedParser, (req, res)=> {
        API.meter_readings().deleteMeterReading("id", req.params.id)
            .then(({data, code})=> {
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                return res.status(code).send(err);
            });
    });
};