/**
 * Created by paulex on 7/18/17.
 */

const Log = require(`${__dirname}/../../../core/logger`);
const RecognitionService = require('../../Users/model/services/RecognitionService');

module.exports.controller = function (app, {API, jsonParser, urlencodedParser, multiPart}) {
    app.use('/faults*', (req, res, next)=>API.recognitions().auth(req, res, next));

    /**
     * @swagger
     * /faults:
     *   post:
     *     summary: Creates a Fault
     *     description: ''
     *     tags: [Fault]
     *     consumes:
     *     - application/json
     *     produces:
     *     - application/json
     *     operationId: createFault
     *     responses:
     *       '200':
     *         description: Successfully Added
     *     parameters:
     *      - $ref: '#/parameters/sessionId'
     *      - in: body
     *        name: 'fault'
     *        required: true
     *        schema:
     *          $ref: '#/definitions/postFaultInput'
     */
    app.post('/faults', multiPart.array("files", 5), (req, res)=> {
        API.faults().createFault(req.body, req.who, req.files, API)
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
     * /faults:
     *   put:
     *     summary: Updates a Fault
     *     description: ''
     *     tags: [Fault]
     *     consumes:
     *     - application/json
     *     produces:
     *     - application/json
     *     operationId: updateFault
     *     responses:
     *       '200':
     *         description: Successfully Added
     *     parameters:
     *      - $ref: '#/parameters/sessionId'
     *      - in: body
     *        name: 'fault'
     *        required: true
     *        schema:
     *          $ref: '#/definitions/postFaultInput'
     */
    app.put('/faults', jsonParser, (req, res)=> {
        API.faults().updateFault(req.body, req.who)
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
     * /faults/user/{user_id}/{offset}/{limit}:
     *   get:
     *     summary: Gets faults assigned to a user
     *     description: ''
     *     tags: [Fault]
     *     produces:
     *     - application/json
     *     operationId: getFaults
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getFaultOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - in: path
     *       name: user_id
     *       required: true
     *     - $ref: '#/parameters/offset'
     *     - $ref: '#/parameters/limit'
     */
    app.get('/faults/user/:user_id/:offset?/:limit?', urlencodedParser, (req, res)=> {
        let assignedTo = {id: req.params['user_id']};
        return API.faults().getFaults(`{"id":${req.params['user_id']}}`, "assigned_to->[]", req.who, req.params.offset, req.params.limit)
            .then(({data, code})=> {
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                return res.status(code).send(err);
            });
    });


    /**
     * @swagger
     * /faults/{id}/notes/{offset}/{limit}:
     *   get:
     *     summary: Gets Notes for a Fault
     *     description: ''
     *     tags: [Fault]
     *     produces:
     *     - application/json
     *     operationId: getFaultNotes
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getNoteOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - in: path
     *       name: id
     *       required: true
     *     - $ref: '#/parameters/offset'
     *     - $ref: '#/parameters/limit'
     */
    app.get('/faults/:id/notes/:offset?/:limit?', urlencodedParser, (req, res)=> {
        console.log("called");
        return API.notes().getNotes(req.params['id'], "faults", "relation_id", req.who, req.params.offset, req.params.limit)
            .then(({data, code})=> {
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                return res.status(code).send(err);
            });
    });


    /**
     * @swagger
     * /faults/{id}/attachments/{offset}/{limit}:
     *   get:
     *     summary: Gets Attachments for a Fault
     *     description: ''
     *     tags: [Fault]
     *     produces:
     *     - application/json
     *     operationId: getFaultAttachments
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getAttachmentOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - in: path
     *       name: id
     *       required: true
     *     - $ref: '#/parameters/offset'
     *     - $ref: '#/parameters/limit'
     */
    app.get('/faults/:id/attachments/:offset?/:limit?', urlencodedParser, (req, res)=> {
        console.log("called");
        return API.attachments().getAttachments(req.params['id'], "faults", "relation_id", req.who, req.params.offset, req.params.limit)
            .then(({data, code})=> {
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                return res.status(code).send(err);
            });
    });


    /**
     * @swagger
     * /faults/{offset}/{limit}:
     *   get:
     *     summary: Gets List of faults
     *     description: ''
     *     tags: [Fault]
     *     produces:
     *     - application/json
     *     operationId: getFaults
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getFaultOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - $ref: '#/parameters/offset'
     *     - $ref: '#/parameters/limit'
     */
    app.get('/faults/:id', urlencodedParser, (req, res)=> {
        return API.faults().getFaults(req.params['id'], "id")
            .then(({data, code})=> {
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                return res.status((code) ? code : 500).send((err) ? err : "Internal Server Error")
            });
    });

    /**
     * @swagger
     * /faults/{id}:
     *  delete:
     *    summary: Deletes a Fault
     *    description: "Deletes a Fault"
     *    tags: [Fault]
     *    produces:
     *    - application/json
     *    operationId: deleteFault
     *    responses:
     *      '200':
     *        description: Returns true with the id of the request deleted
     *    parameters:
     *    - $ref: '#/parameters/sessionId'
     *    - $ref: '#/parameters/fault_id'
     */
    app.delete('/faults/:id', urlencodedParser, (req, res)=> {
        API.faults().deleteFault("id", req.params.id)
            .then(({data, code})=> {
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                return res.status(code).send(err);
            });
    });
};