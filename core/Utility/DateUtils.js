/**
 * Created by paulex on 9/6/17.
 */
module.exports = function DateUtils(){

};

/**
 *
 * @param jsDate {Date}
 * @returns {string}
 */
module.exports.dateToMysql = function(jsDate){
    return jsDate.toISOString().slice(0, 19).replace('T', ' ');
};

module.exports.elapsedTime = function(jsDate){

};