/**
 * @author Paul Okeke
 * Created by paulex on 7/4/17.
 */

const Log = require(`${__dirname}/../../../core/logger`);
const RecognitionService = require('../../Users/model/services/RecognitionService');

module.exports.controller = function (app, {API, jsonParser, urlencodedParser}) {
    app.use('/staffs', (req, res, next)=>API.recognitions().auth(req, res, next));
};