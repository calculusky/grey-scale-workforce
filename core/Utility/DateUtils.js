/**
 * Created by paulex on 9/6/17.
 */
const moment = require("moment");
module.exports = function DateUtils(){

};

/**
 *
 * @param jsDate {Date}
 * @param format
 * @returns {string}
 */
module.exports.dateToMysql = function (jsDate = new Date(), format = "YYYY-MM-DD H:m:s") {
    return moment(jsDate).format(format);
};

module.exports.moment = moment;

module.exports.elapsedTime = function(jsDate){

};