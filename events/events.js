/**
 * Created by paulex on 10/18/17.
 */
const Session = require('../core/Session');

exports.init = function (context, io, API) {
    this.eventListeners = [];
    this.sharedData = {
        clients: {}//save all the connected socket id here
    };

    const register = (context, io, API, sharedData) => {
        //TODO put this file in a config
        const eventListenersPath = [
            './LocationEvent',
            './EmailEvent',
            './WebEvent',
            './ApplicationEvent',
            './MessageEvent',
            './IntegratorEvent'
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

        //lets create an event for registering clients
        socket.on("add_me", user => {
            if (user && (user.username || user.id)) {
                const clientSocs = this.sharedData.clients[user.id] || [];
                clientSocs.push(socket.id);
                this.sharedData.clients[user.id] = clientSocs;
                this.sharedData.clients[socket.id] = user.id;
                console.log(`${user.username} connected with id:${socket.id}`);
            }
        });

        socket.on("disconnect", () => {
            const userId = this.sharedData.clients[socket.id];
            const clientSocs = this.sharedData.clients[userId];
            if (!userId) return;
            if (clientSocs.includes(socket.id)) {
                clientSocs.splice(clientSocs.indexOf(socket.id), 1);
                this.sharedData.clients[userId] = clientSocs;
                if (!this.sharedData.clients[userId].length) delete this.sharedData.clients[userId];
                console.log(`user with ID:${userId} disconnected :${socket.id}`);
            }
            delete this.sharedData.clients[socket.id];
        });

        /*
        |---------------------------------------------------
        | Listens for location updates
        |---------------------------------------------------
         */
        socket.on("update_location", data => {
            //@todo build a session for the user
            this.eventListeners.forEach(listener => listener.emit('update_location', data, socket));
            io.sockets.emit("update_location", data);
        });

        socket.on("register_location_update", (data) => {
            socket.join(`location_update_${data.id}`);
        });

        //data : {id:1, username:""}
        socket.on("unregister_location_update", (data) => {
            socket.leave(`location_update_${data.id}`, (err) => {
                if (err) console.log(`Couldn't remove user from room: location_update_${data.id}`);
            });
        });

    });
};

exports.emit = function (eventName, ...args) {
    if (!this.eventListeners) return;
    this.eventListeners.forEach(listener => {
        if (listener) listener.emit(eventName, ...args);
    });
};


