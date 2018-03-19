/**
 * Created by paulex on 10/18/17.
 */
exports.init = function (context, io, API) {
    this.eventListeners = [];
    this.sharedData = {};

    const register = (context, io, API, sharedData) => {
        //TODO put this file in a config
        const eventListenersPath = [
            './LocationEvent',
            './EmailEvent'
        ];

        eventListenersPath.forEach(listener => {
            try {
                let EventListener = require(listener);
                //Just in-case the init function doesn't return an object(this)
                this.eventListeners.push(EventListener.init(context, io, API, sharedData) || EventListener);
            } catch (e) {
                //File not found
                console.log(e);
            }
        });
    };

    //Register all event listeners
    register(context, io, API, this.sharedData);

    //Listen for connections and emitted client events
    io.on("connection", socket => {

        socket.on("update_location", data => {
            console.log(data);
            this.eventListeners.forEach(listener => listener.emit('update_location', data, this.sharedData))
        });

        socket.on("notes_added", data => {
            console.log(data);
        });

        socket.on("message", (e) => {
            console.log(e);
            io.emit("update_location", "something happened");
        });

        console.log("I'm connected as i am");
    });
};

exports.emit = function (eventName, ...args) {
    this.eventListeners.forEach(listener => {
        if (listener) listener.emit(eventName, ...args)
    });
};


