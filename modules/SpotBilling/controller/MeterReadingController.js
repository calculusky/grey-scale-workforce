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
     *     tags: [MeterReading]
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
     * /meter_readings:
     *   put:
     *     summary: Updates a MeterReading
     *     description: ''
     *     tags: [MeterReading]
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


    // /**
    //  * @swagger
    //  * /meter_readings/user/{user_id}/{offset}/{limit}:
    //  *   get:
    //  *     summary: Gets meter_readings assigned to a user
    //  *     description: ''
    //  *     tags: [MeterReading]
    //  *     produces:
    //  *     - application/json
    //  *     operationId: getMeterReadings
    //  *     responses:
    //  *       '200':
    //  *         description: Successful
    //  *         schema:
    //  *           $ref: '#/definitions/getMeterReadingOutput'
    //  *     parameters:
    //  *     - $ref: '#/parameters/sessionId'
    //  *     - in: path
    //  *       name: user_id
    //  *       required: true
    //  *     - $ref: '#/parameters/offset'
    //  *     - $ref: '#/parameters/limit'
    //  */
    // app.get('/meter_readings/user/:user_id/:offset?/:limit?', urlencodedParser, (req, res)=> {
    //     return API.meter_readings().getMeterReadings(req.params['user_id'], "assigned_to", req.who, req.params.offset, req.params.limit)
    //         .then(({data, code})=> {
    //             return res.status(code).send(data);
    //         })
    //         .catch(({err, code})=> {
    //             return res.status(code).send(err);
    //         });
    // });


    /**
     * @swagger
     * /meter_readings/{id}:
     *   get:
     *     summary: Gets List of meter_readings
     *     description: ''
     *     tags: [MeterReading]
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
     *     - $ref: '#/parameters/offset'
     *     - $ref: '#/parameters/limit'
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
     * /meter_readings/meter/{meterNo}:
     *   get:
     *     summary: Gets List of meter_readings by the meter no
     *     description: ''
     *     tags: [MeterReading]
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
     *     - $ref: '#/parameters/offset'
     *     - $ref: '#/parameters/limit'
     */
    app.get('/meter_readings/meter/:meterNo', urlencodedParser, (req, res)=> {
        return API.meter_readings().getMeterReadings(req.params['meterNo'], "meter_no")
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
     *    tags: [MeterReading]
     *    produces:
     *    - application/json
     *    operationId: deleteMeterReading
     *    responses:
     *      '200':
     *        description: Returns true with the id of the request deleted
     *    parameters:
     *    - $ref: '#/parameters/sessionId'
     *    - $ref: '#/parameters/fault_id'
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