/**
 * Created by paulex on 7/18/17.
 */

const Log = require(`${__dirname}/../../../core/logger`);
const RecognitionService = require('../../Users/model/services/RecognitionService');

module.exports.controller = function (app, {API, jsonParser, urlencodedParser}) {
    app.use('/departments', (req, res, next)=>API.recognitions().auth(req, res, next));

    /**
     * @swagger
     * /departments/{id}/staffs/{staffId}:
     *   post:
     *     summary: Add a staff to a department
     *     description: ''
     *     tags: [Department]
     *     consumes:
     *     - application/json
     *     produces:
     *     - application/json
     *     operationId: addStaffToDepartment
     *     responses:
     *       '200':
     *         description: Successfully Added
     *     parameters:
     *       - in: path
     *         name: id
     *         description: Department ID
     *         required: true
     *       - in: path
     *         name: staffId
     *         description: Staff ID
     *         required: true
     */
    app.post('/departments/:id/staffs/:staffId', urlencodedParser, (req, res)=> {
        return res.send("Not yet implemented");
    });

    /**
     * @swagger
     * /departments/{id}/manager:
     *   get:
     *     summary: Gets the manager of a particular department
     *     description: ''
     *     tags: [Department]
     *     produces:
     *     - application/json
     *     operationId: getDepartmentManager
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getDepartmentManagerOutput'
     *     parameters:
     *       - in: path
     *         name: id
     *         description: Departments ID
     *         required: true
     */
    app.get('/departments/:id/manager', urlencodedParser, (req, res)=>{
        return res.send("Not yet implemented");
    });

    /**
     * @swagger
     * /departments/{id}/staffs:
     *   get:
     *     summary: Get all staffs that belongs to this department
     *     description: ''
     *     tags: [Department]
     *     produces:
     *     - application/json
     *     operationId: getDepartmentStaffs
     *     responses:
     *       '200':
     *         description: Successful
     *         schema:
     *           $ref: '#/definitions/getDepartmentStaffsOutput'
     *     parameters:
     *       - in: path
     *         name: id
     *         description: Department ID
     *         required: true
     */
    app.get('/departments/:id/staffs', urlencodedParser, (req, res)=>{
        return res.send("Not yet implemented");
    });
};