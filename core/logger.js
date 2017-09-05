/**
 * Created by paulex on 7/5/17.
 */
module.exports = function logger() {

};

//TODO we should write all this to a file or better still get a logging lib

module.exports.e = function (tag, message) {
    //TODO write log to file
    console.error(tag, message);
};

module.exports.warn = function (tag, message) {
    //TODO write log to file
};

module.exports.info = function (tag, message) {
    console.log(tag, message);
};