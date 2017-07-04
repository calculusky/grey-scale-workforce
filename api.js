/**
 * Created by paulex on 7/2/17.
 */
const UsersController = require('./controllers/UsersController');
const TravelRequestController = require('./controllers/TravelRequestController');


/**
 * @name API
 */
class API {

    constructor() {
        this.userCtrl = new UsersController();
        this.travelRequestCtrl = new TravelRequestController();
    }

    /**
     * @name users
     * @param req
     * @param res
     * @returns {UsersController|*}
     */
    users(req, res) {
        return this.userCtrl;
    }

    /**
     * @name travels
     * @param req
     * @param res
     * @returns {TravelRequestController|*}
     */
    travels(req, res) {
        return this.travelRequestCtrl;
    }

}

module.exports = new API();
