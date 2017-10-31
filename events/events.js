/**
 * Created by paulex on 10/18/17.
 */
module.exports.init = function (io, API) {
    io.on("connection", socket=> {
        io.emit('update_location', {key:'Balo'});
        socket.on("update_location", data=> {
            io.emit('update_location', {key:'Balo'});
        });

        socket.on("notes_added", data => {
            console.log(data);
        });

        console.log("im connected as im");
    });
};

//TODO we should be able to register events here