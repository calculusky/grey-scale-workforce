/**
 * Created by paulex on 8/22/17.
 */

const Log = require(`${__dirname}/../../../core/logger`);
const RecognitionService = require('../../Users/model/services/RecognitionService');

module.exports.controller = function (app, {API, jsonParser, urlencodedParser, multiPart}) {
    app.use('/uploads*', (req, res, next)=>API.recognitions().auth(req, res, next));

    /**
     * @swagger
     * /uploads:
     *   post:
     *     summary: Upload a file
     *     description: ''
     *     tags: [Upload]
     *     consumes:
     *     - application/json
     *     produces:
     *     - application/json
     *     operationId: uploadFile
     *     responses:
     *       '200':
     *         description: Successfully Added
     *     parameters:
     *      - $ref: '#/parameters/sessionId'
     *      - in: body
     *        name: 'fault'
     *        required: true
     *        schema:
     *          $ref: '#/definitions/postUploadInput'
     */
    app.post('/uploads', multiPart.array('files', 2), (req, res)=> {
        API.uploads().uploadFile(req.body, req.who, req.files)
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
     * /uploads/{id}:
     *  delete:
     *    summary: Deletes a Upload
     *    description: "Deletes a Upload"
     *    tags: [Upload]
     *    produces:
     *    - application/json
     *    operationId: deleteUpload
     *    responses:
     *      '200':
     *        description: Returns true with the id of the request deleted
     */
    app.delete('/uploads/:id', urlencodedParser, (req, res)=> {
        API.uploads().deleteUpload("id", req.params.id)
            .then(({data, code})=> {
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                return res.status(code).send(err);
            });
    });
};