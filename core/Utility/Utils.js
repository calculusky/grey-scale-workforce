/**
 * Created by paulex on 9/6/17.
 */
const DateUtils = require('./DateUtils');
const MapperUtils = require('./MapperUtil');


module.exports = function Utils(){
    
};

module.exports.date = function(){
  return DateUtils;  
};


module.exports.mapper = function(){
  return MapperUtils;
};


module.exports.buildResponse = function ({status="success", data, msg, type, code, desc, isRoute=true}, statusCode = 200) {
    let responseBody = {};
    responseBody.status = status;

    if (status !== "error" && data) responseBody.data = data;
    if (msg) responseBody.message = msg;
    if (type) responseBody.type = type;
    if (code) responseBody.code = code;
    if(desc) responseBody.description = desc;
    if (isRoute) {
        let response = {};
        if (status == "success") {
            response.data = responseBody;
            response.code = statusCode;
        } else {
            response.err = responseBody;
            response.code = statusCode;
        }
        return response;
    }
    return responseBody;
};