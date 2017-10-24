/**
 * Created by paulex on 10/18/17.
 */
module.exports.init = function (io, API) {
    io.on("connection", socket=> {

        socket.on("update_location", data=> {
            console.log(data);
        });

        socket.on("notes_added", data => {
            console.log(data);
        });

        console.log("im connected as im");
    });
};

//TODO we should be able to register events here