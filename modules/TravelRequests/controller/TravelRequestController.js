/**
 * Created by paulex on 7/5/17.
 */

module.exports.controller = function(app, {API, jsonParser, urlencodedParser}){


    /**
     * @swagger
     * /request:
     *  post:
     *      description: "Creates a new Travel Request"
     *      summary: "Create a new Travel Request"
     *      tags: ['Travel Request']
     *      produces:
     *      -   application/json
     *      operationId: postRequest
     *      responses:
     *          '200':
     *              description: "The newly created Travel Request"
     *              schema:
     *                  $ref: '#/definitions/Request'
     *      parameters:
     *      - $ref: '#/parameters/sessionId'
     *      - name: "travel-request"
     *        in: body
     *        required: true
     *        schema:
     *          $ref: '#/definitions/newRequest'
     */
    app.post('/request', jsonParser, (req, res)=> {
        console.log(req.body);
        return res.json(req.body);
    });


    /**
     * @swagger
     * /requests/{id}:
     *  put:
     *      summary: "Update an existing travel request."
     *      description: "Update an already existing travel request"
     *      tags: ['Travel Request']
     *      produces:
     *      - application/json
     *      operationId: "updateRequest"
     *      responses:
     *          '200':
     *              description: "Returns a Travel Request Object"
     *              schema:
     *                  $ref: '#/definitions/Request'
     *      parameters:
     *          - $ref: '#/parameters/sessionId'
     *          - $ref : '#/parameters/req_id'
     *          - name: 'travel-request'
     *            in: body
     *            required: true
     *            schema:
     *              $ref: '#/definitions/newRequest'
     */
    app.put('/requests/:id', jsonParser, (req, res)=> {

    });


    /**
     * @swagger
     * /requests/{id}:
     *    get:
     *      description: "Returns a Specific Travel Request by the given ID"
     *      summary: "Finds a Travel Request by the given ID"
     *      tags: ['Travel Request']
     *      produces:
     *      -   application/json
     *      operationId: "getRequest"
     *      responses:
     *          '200':
     *             description: "A Travel Request Object"
     *             schema:
     *                  $ref: '#/definitions/Request'
     *      parameters:
     *       - name: id
     *         description: Request ID
     *         in: path
     *         required: true
     *         type: integer
     *
     */
    app.get('/requests/:id', (req, res)=> {
        return res.json({
            req_type: 1,
            req_requester_id: 2,
            req_manager_id: 3,
            req_status: 4,
            req_approved_by: 8,
            req_details: 9,
            req_duration: 10
        });
    });


    /**
     * @swagger
     * /requests/status/{statusId}:
     *  get:
     *      summary: "Retrieves a Travel Request by status"
     *      description: "This can be used to retrieve travel request based on their status conditions.
     *                    e.g Approved Request, Pending Request or Rejected Request"
     *      tags: ['Travel Request']
     *      produces:
     *      - application/json
     *      operationId: "getRequest"
     *      responses:
     *          '200':
     *              description: A list of Travel Request
     *              schema:
     *                  type: array
     *                  $ref: '#/definitions/Request'
     *      parameters:
     *          - $ref: '#/parameters/sessionId'
     *          - $ref: '#/parameters/req_status'
     *          - $ref: '#/parameters/offset'
     *          - $ref: '#/parameters/limit'
     */
    app.get('/requests/status/:statusId', urlencodedParser, (req, res)=> {

    });

    /**
     * @swagger
     * /requests/user/{userId}/status/{statusId}:
     *  get:
     *      summary: "Retrieves Travel Request that belongs a user by a request status id"
     *      description: "Retrieves Travel Request by specifying the user id and the status id. e.g Say we want to
     *                    retrieve a travel request that belongs to UserA and is Approved, this route a perfect fit
     *                    for such."
     *      tags: ['Travel Request']
     *      produces:
     *      - application/json
     *      operationId: "getRequest"
     *      responses:
     *          '200':
     *              description: 'Returns a list of Travel Request Object'
     *              schema:
     *                  type: array
     *                  $ref: '#/definitions/Request'
     *      parameters:
     *          - $ref: '#/parameters/sessionId'
     *          - $ref: '#/parameters/usr_id'
     *          - $ref: '#/parameters/req_status'
     */
    app.get('/requests/user/:userId/status/:statusId', urlencodedParser, (req, res)=> {
        console.log(req.body);
        res.json({});
    });


    /**
     * @swagger
     * /requests/user/{userId}:
     *  get:
     *      description: 'Retrieves a list of Travel Request that belongs to a particular
     *          user as specified by the userId path parameter'
     *      summary: 'Retrieves Travel Request belonging to a User'
     *      tags: ['Travel Request']
     *      produces:
     *      - application/json
     *      operationId: "getRequest"
     *      responses:
     *          '200':
     *              description: "A list of Travel Request"
     *              schema:
     *                  type: array
     *                  $ref: '#/definitions/Request'
     *      parameters:
     *          - $ref: '#/parameters/usr_id'
     *          - $ref: '#/parameters/offset'
     *          - $ref: '#/parameters/limit'
     */
    app.get('/requests/user/:id/:offset?/:limit?', urlencodedParser, (req, res)=> {
        console.log(req.params);
    });


    /**
     * @swagger
     * /requests/{id}/status/{statusId}:
     *  put:
     *      summary: "Updates the status of a Travel Request"
     *      description: "This can be used to update a travel request to either of the following :
     *                    Approved, Pending or Rejected"
     *      tags: ['Travel Request']
     *      produces:
     *      - application/json
     *      operationId: "updateRequest"
     *      responses:
     *          '200':
     *              description: The updated travel request
     *              schema:
     *                  type: object
     *                  $ref: '#/definitions/Request'
     *      parameters:
     *          - $ref: '#/parameters/sessionId'
     *          - $ref: '#/parameters/req_id'
     *          - $ref: '#/parameters/req_status'
     */
    app.put('/requests/:id/status/:statusId', urlencodedParser, (req, res)=> {
        res.json({});
    });

    /**
     * @swagger
     * /requests/{id}:
     *  delete:
     *      summary: Deletes a travel request
     *      description: "Deletes a travel request by the specified request {id}"
     *      tags: ['Travel Request']
     *      produces:
     *      - application/json
     *      operationId: deleteRequest
     *      responses:
     *          '200':
     *              description: Returns true with the id of the request deleted
     *      parameters:
     *          - $ref: '#/parameters/req_id'
     */
    app.delete('/requests/:id', (req, res)=> {
        res.status(200).send("successfully deleted");
    });
    
};