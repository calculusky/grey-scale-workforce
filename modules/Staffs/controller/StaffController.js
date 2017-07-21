/**
 * @author Paul Okeke
 * Created by paulex on 7/4/17.
 */

const Log = require(`${__dirname}/../../../core/logger`);
const RecognitionService = require('../../Users/model/services/RecognitionService');

module.exports.controller = function (app, {API, jsonParser, urlencodedParser}) {
    app.use('/staffs', (req, res, next)=>API.recognitions().auth(req, res, next));

    /**
     * @swagger
     * /staffs:
     *   post:
     *     description: It might be important for you to create a staff associated with a user.
     *                  If that is the case this route enables you create staffs for your organization.
     *                  Note that to create a staff a user for this entity must have already been created.
     *     summary: Creates a new Staff
     *     tags: [Staff]
     *     consumes:
     *     - application/json
     *     produces:
     *     - application/json
     *     operationId: postStaff
     *     responses:
     *       '200':
     *         description: Staff Created successfully
     *         schema:
     *           $ref: '#/definitions/postStaffOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - name: 'body'
     *       in: body
     *       required: true
     *       schema:
     *         $ref: '#/definitions/postStaffInput'
     */
    app.post('/staffs', jsonParser, (req, res)=> {
        return res.json("Not yet implemented");
    });


    /**
     * @swagger
     * /staffs:
     *   put:
     *     description: ''
     *     summary: Update a staff details
     *     tags: [Staff]
     *     consumes:
     *     - application/json
     *     produces:
     *     - application/json
     *     operationId: updateStaff
     *     responses:
     *       '200':
     *         description: Staff details updated successfully
     *         schema:
     *           $ref: '#/definitions/postStaffOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - name: body
     *       in: body
     *       required: true
     *       schema:
     *         $ref: '#/definitions/postStaffInput'
     */
    app.put('/staffs', jsonParser, (req, res)=> {
        return res.send("Not yet implemented");
    });


    /**
     * @swagger
     * /staffs/{id}:
     *  get:
     *    description: ""
     *    summary: 'Retrieves a staff details by the ID'
     *    tags: [Staff]
     *    produces:
     *    - application/json
     *    operationId: getStaffById
     *    responses:
     *      '200':
     *        schema:
     *          $ref: '#/definitions/getStaffOutput'
     *    parameters:
     *    - $ref: '#/parameters/sessionId'
     *    - in: path
     *      name: id
     *      description: staff id
     *      required: true
     *
     */
    app.get('/staffs/:id', urlencodedParser, (req, res)=> {
        Log.info('/staffs/:id', `/staffs/:${req.params.id}`);
        API.staffs().getStaffs(req.params.id)
            .then(({data, code=200})=> {
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                return res.status(code).send(err);
            });
    });


    /**
     * @swagger
     * /staffs/{id}/managers:
     *   get:
     *     description: The manager of the staff is retrieved based on the
     *                  the department this staff belongs to. If this staff belongs
     *                  to more than 1 department, this route returns the manager for
     *                  department the staff belongs to.
     *     summary: Retrieves the staff manager
     *     tags: [Staff]
     *     produces:
     *     - application/json
     *     operationId: getStaffManagers
     *     responses:
     *       '200':
     *         schema:
     *           $ref: '#/definitions/getStaffManagersOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - in: path
     *       name: id
     *       description: The staff id
     *       required: true
     */
    app.get('/staffs/:id/managers', urlencodedParser, (req, res)=> {
        Log.info('/staffs/:id/managers', `/staffs/:${req.params.id}/managers`);
        API.staffs().getStaffManagers(req.params.id)
            .then(({data, code=200})=> {
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                return res.status(code).send(err);
            });
    });

    /**
     * @swagger
     * /staffs/{id}/departments:
     *   get:
     *     summary: Retrieves a list of departments the staff belongs to
     *     description: ''
     *     tags: [Staff]
     *     produces:
     *     - application/json
     *     operationId: getStaffDepartments
     *     responses:
     *       '200':
     *         schema:
     *           $ref: '#/definitions/getStaffDepartmentsOutput'
     *     parameters:
     *     - $ref: '#/parameters/sessionId'
     *     - in: path
     *       name: id
     *       description: The staff id
     *       required: true
     */
    app.get('/staffs/:id/departments', urlencodedParser, (req, res)=>{
        Log.info('/staffs/:id/departments', `/staffs/:${req.params.id}/departments`);
        API.staffs().getStaffDepartments(req.params.id)
            .then(({data, code=200})=> {
                return res.status(code).send(data);
            })
            .catch(({err, code})=> {
                return res.status(code).send(err);
            });
    });
};