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
module.exports.dateToMysql = function(jsDate, format="YYYY-MM-DD"){
    return moment(jsDate).format(format);
};

module.exports.elapsedTime = function(jsDate){

};