/**
 * Created by paulex on 8/22/17.
 */

const Log = require(`${__dirname}/../../../core/logger`);
/**
 *
 * @param app
 * @param API {API}
 * @param jsonParser
 * @param urlencodedParser
 * @param multiPart
 */
module.exports.controller = function (app, {API, jsonParser, urlencodedParser, multiPart}) {
    app.use('/notes', (req, res, next) => API.recognitions().auth(req, res, next));

    /**
     * @swagger
     * /notes:
     *   post:
     *     summary: Creates a Note
     *     description: ''
     *     tags: [Notes]
     *     consumes:
     *     - application/json
     *     produces:
     *     - application/json
     *     operationId: createNote
     *     responses:
     *       '200':
     *         description: Successfully Added
     *     parameters:
     *      - $ref: '#/parameters/sessionId'
     *      - in: body
     *        name: 'note'
     *        required: true
     *        schema:
     *          $ref: '#/definitions/postNoteInput'
     */
    app.post('/notes', multiPart.array("files", 5), (req, res) => {
        console.log(req.body);
        API.notes().createNote(req.body, req.who, API, req.files)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                console.log(code, err);
                return res.status(code).send(err);
            });
    });

    /**
     * @swag
     * /notes/user/{user_id}/{offset}/{limit}:
     *   get:
     *     summary: Gets notes assigned to a user
     *     description: ''
     *     tags: [Notes]
     *     produces:
     *     - application/json
     *     operationId: getNotesByUser
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getNoteOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - $ref: '#/parameters/offset'
     *     - $ref: '#/parameters/limit'
     *     - $ref: '#/parameters/user_id'
     */
    app.get('/notes/user/:user_id/:offset?/:limit?', urlencodedParser, (req, res) => {
        return API.notes().getNotes(req.params['user_id'], "note_by", req.who, req.params.offset, req.params.limit)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });


    /**
     * @swag
     * /notes/{id}:
     *  delete:
     *    summary: Deletes a Note
     *    description: "Deletes a Note"
     *    tags: [Notes]
     *    produces:
     *    - application/json
     *    operationId: deleteNote
     *    responses:
     *      '200':
     *        description: Returns true with the id of the request deleted
     *    parameters:
     *    - $ref: '#/parameters/sessionId'
     *    - $ref: '#/parameters/fault_id'
     */
    app.delete('/notes/:id', urlencodedParser, (req, res) => {
        API.notes().deleteNote("id", req.params.id)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });
};