/**
 * Created by paulex on 7/5/17.
 */
module.exports = function logger() {

};

module.exports.e = function (tag, message) {
    //TODO write log to file
    console.log(tag, message);
};

module.exports.warn = function (tag, message) {
    //TODO write log to file
};

module.exports.info = function (tag, message) {
    console.log(tag, message);
};