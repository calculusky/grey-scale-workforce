/**
 * Created by paulex on 10/31/17.
 */
const EventEmitter = require('events').EventEmitter;
const nUtils = require('util');
// nUtils.inherits(LocationEvent, EventEmitter);

class LocationEvent extends EventEmitter{

    constructor(context, io, API){
        super();
        this.context = context;
        this.io = io;
        this.api = API;
        this.name = "Paul Okeke";
        
        this.on('update_location', this.broadcastLocation)
    }
    
    broadcastLocation(data){
        console.log(this);
    }
    
}

module.exports = LocationEvent;

