/**
 * Created by paulex on 9/6/17.
 */
const moment = require("moment");
module.exports = function DateUtils(){

};

/**
 *
 * @param jsDate {Date}
 * @returns {string}
 */
module.exports.dateToMysql = function(jsDate){
    return moment(jsDate).format("YYYY-MM-DD");
};

module.exports.elapsedTime = function(jsDate){

};