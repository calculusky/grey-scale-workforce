/**
 * Created by paulex on 02/26/18.
 */

const Log = require(`${__dirname}/../../../core/logger`);
const RecognitionService = require('../../Users/model/services/RecognitionService');

module.exports.controller = function (app, {API, jsonParser, urlencodedParser}) {
    app.use('/workflows*', (req, res, next) => API.recognitions().auth(req, res, next));


    // app.post('/workflows/users', jsonParser, (req, res)=> {
    //     console.log(req.body);
    //     API.workflows().createUser(req.body, req.who)
    //         .then(({data, code})=> {
    //             console.log(data);
    //             return res.status(code).send(data);
    //         })
    //         .catch(({err, code})=> {
    //             console.log(code, err);
    //             return res.status(code).send(err);
    //         });
    // });
    //
    // app.post('/workflows/groups', jsonParser, (req, res)=> {
    //     console.log(req.body);
    //     API.workflows().createUser(req.body, req.who)
    //         .then(({data, code})=> {
    //             console.log(data);
    //             return res.status(code).send(data);
    //         })
    //         .catch(({err, code})=> {
    //             console.log(code, err);
    //             return res.status(code).send(err);
    //         });
    // });
    //
    // app.put('/workflows', jsonParser, (req, res)=> {
    //     API.workflows().updateAsset(req.body, req.who)
    //         .then(({data, code})=> {
    //             console.log(data);
    //             return res.status(code).send(data);
    //         })
    //         .catch(({err, code})=> {
    //             console.log(code, err);
    //             return res.status(code).send(err);
    //         });
    // });
};