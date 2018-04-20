const Utils = require('./Utils');
const status = 'fail';
module.exports = function () {
    return {
        InternalServerError: Utils.buildResponse({status, msg: 'Internal Server Error'}, 500),
        ValidationFailure: data => Utils.buildResponse({status: "fail", data, code: 'VALIDATION_ERROR'}, 400),
        GroupNotFound: Utils.buildResponse({status: "fail", data: {message: "Group specified doesn't exist"}}, 400)
    }
};