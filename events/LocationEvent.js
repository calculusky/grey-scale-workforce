/**
 * Created by paulex on 10/31/17.
 */
const EventEmitter = require('events').EventEmitter;
const nUtils = require('util');

class LocationEvent extends EventEmitter{

    constructor(context, io, API){
        super();
        this.context = context;
        this.io = io;
        this.api = API;
        this.name = "Paul Okeke";
        
        this.on('update_location', this.broadcastLocation);
    }
    
    broadcastLocation(data){
        //get the user details
        //get the total work orders assigned to this user
        //get the total task handled by this user
        //get the group the user belongs to
        //get how many work order has been resolved today.. e.g FaultWorkOrder 2. Disconnection 3.
        //How many work order has been scheduled for today?
        //call geo-location service to the address of the user
        //
        console.log(data);
    }
    
}

module.exports = LocationEvent;

