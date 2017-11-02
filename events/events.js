/**
 * Created by paulex on 10/18/17.
 */
module.exports.init = function (context, io, API) {
    this.eventListeners = [];
    this.sharedData = {};

    const register = (context, io, API, sharedData) => {
        const eventListenersPath = [
            './LocationEvent'
        ];

        eventListenersPath.forEach(listener => {
            let EventListener = require(listener);
            this.eventListeners.push(new EventListener(context, io, API, sharedData));
        });
    };

    //Register all event listeners
    register(context, io, API, this.sharedData);

    //Listen for connections and emitted client events
    io.on("connection", socket=> {

        socket.on("update_location", data=> {
            this.eventListeners.forEach(listener => listener.emit('update_location', data, this.sharedData))
        });

        socket.on("notes_added", data => {
            console.log(data);
        });

        console.log("I'm connected as i am");
    });
};


