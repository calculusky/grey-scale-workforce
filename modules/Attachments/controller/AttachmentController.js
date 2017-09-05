/**
 * Created by paulex on 8/22/17.
 */

const Log = require(`${__dirname}/../../../core/logger`);
const RecognitionService = require('../../Users/model/services/RecognitionService');

module.exports.controller = function (app, {API, jsonParser, urlencodedParser, multiPart}) {
    app.use('/attachments*', (req, res, next)=>API.recognitions().auth(req, res, next));

    /**
     * @swagger
     * /attachments:
     *   post:
     *     summary: Creates a Attachment
     *     description: ''
     *     tags: [Attachment]
     *     consumes:
     *     - application/json
     *     produces:
     *     - application/json
     *     operationId: createAttachment
     *     responses:
     *       '200':
     *         description: Successfully Added
     *     parameters:
     *      - $ref: '#/parameters/sessionId'
     *      - in: body
     *        name: 'fault'
     *        required: true
     *        schema:
     *          $ref: '#/definitions/postAttachmentInput'
     */
    app.post('/attachments', multiPart.array('files', 8), (req, res)=> {
        console.log(req.body);
        API.attachments().createAttachment(req.body, req.who)
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
     * /attachments:
     *   put:
     *     summary: Updates a Attachment
     *     description: ''
     *     tags: [Attachment]
     *     consumes:
     *     - application/json
     *     produces:
     *     - application/json
     *     operationId: updateAttachment
     *     responses:
     *       '200':
     *         description: Successfully Added
     *     parameters:
     *      - $ref: '#/parameters/sessionId'
     *      - in: body
     *        name: 'fault'
     *        required: true
     *        schema:
     *          $ref: '#/definitions/postAttachmentInput'
     */
    app.put('/attachments', jsonParser, (req, res)=> {
        API.attachments().updateAttachment(req.body, req.who)
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
     * /attachments/user/{user_id}/{offset}/{limit}:
     *   get:
     *     summary: Gets attachments assigned to a user
     *     description: ''
     *     tags: [Attachment]
     *     produces:
     *     - application/json
     *     operationId: getAttachments
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getAttachmentOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - in: path
     *       name: user_id
     *       required: true
     *     - $ref: '#/parameters/offset'
     *     - $ref: '#/parameters/limit'
     */
    app.get('/attachments/user/:user_id/:offset?/:limit?', urlencodedParser, (req, res)=> {
        return API.attachments().getAttachments(req.params['user_id'], "note_by", req.who, req.params.offset, req.params.limit)
            .then(({data, code})=> {
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                return res.status(code).send(err);
            });
    });


    // /**
    //  * @swagger
    //  * /attachments/{offset}/{limit}:
    //  *   get:
    //  *     summary: Gets List of attachments
    //  *     description: ''
    //  *     tags: [Attachment]
    //  *     produces:
    //  *     - application/json
    //  *     operationId: getAttachments
    //  *     responses:
    //  *       '200':
    //  *         description: Successful
    //  *         schema:
    //  *           $ref: '#/definitions/getAttachmentOutput'
    //  *     parameters:
    //  *     - $ref: '#/parameters/sessionId'
    //  *     - $ref: '#/parameters/offset'
    //  *     - $ref: '#/parameters/limit'
    //  */
    // app.get('/attachments/:offset?/:limit?', urlencodedParser, (req, res)=> {
    //     return API.attachments().getAttachments(req.params['user_id'], "assigned_to", req.who, req.params.offset, req.params.limit)
    //         .then(({data, code})=> {
    //             return res.status(code).send(data);
    //         })
    //         .catch(({err, code})=> {
    //             return res.status(code).send(err);
    //         });
    // });

    /**
     * @swagger
     * /attachments/{id}:
     *  delete:
     *    summary: Deletes a Attachment
     *    description: "Deletes a Attachment"
     *    tags: [Attachment]
     *    produces:
     *    - application/json
     *    operationId: deleteAttachment
     *    responses:
     *      '200':
     *        description: Returns true with the id of the request deleted
     *    parameters:
     *    - $ref: '#/parameters/sessionId'
     *    - $ref: '#/parameters/fault_id'
     */
    app.delete('/attachments/:id', urlencodedParser, (req, res)=> {
        API.attachments().deleteAttachment("id", req.params.id)
            .then(({data, code})=> {
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                return res.status(code).send(err);
            });
    });
};