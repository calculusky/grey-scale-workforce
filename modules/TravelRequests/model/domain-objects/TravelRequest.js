/**
 * Created by paulex on 7/5/17.
 */
// const dbMap = require('./dbMap');

class TravelRequest{
    
    constructor(){
        this.id = '';
        this.requesterId = '';
        this.reqStatus = '';
        this.reqManagerId = '';
        this.reqApprovedBy = '';
        this.reqArrangements = '';
        this.reqReasons = '';
        this.reqDepartureCity = '';
        this.reqArrivalCity  = '';
        this.reqDepartureDate = '';
        this.reqArrivalDate = '';
        this.createdAt = null;
        this.updatedAt = null;
    }

    dbMap(){
        return dbMap;
    }
    
    rules(){
        return {
            required:[
                this.requesterId
            ]
        }
    }
    
}