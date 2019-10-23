/**
 * Created by paulex on 10/09/17.
 */


/**
 *
 * @param app
 * @param API {API}
 * @param jsonParser
 * @param urlencodedParser
 */
module.exports.controller = function (app, {API, jsonParser, urlencodedParser}) {
    app.use('/reports*', (req, res, next) => API.recognitions().auth(req, res, next));

    app.get('/reports/dashboard_basic', urlencodedParser, (req, res) => {
        // console.log(req.who)
        return API.reports().getBasicDashboard(req.who)
            .then(({data, code}) => res.status(code).send(data))
            .catch(({err, code}) => res.status(code).send(err));
    });

    // Disconnection Order
    app.get('/reports/disconnection_order', (req, res) => {
        // console.log(req.query);
        return API.reports().getDisconnectionOrder(req.query)
            .then(({data, code}) => res.status(code).send(data))
            .catch(({err, code}) => res.status(code).send(err));
    });

    // Disconnection Order By Group
    app.get('/reports/disconnection_order/disconnection_order_by_group/:groupId', urlencodedParser, (req, res) => {
        // console.log(req);
        return API.reports().getDisconnectionOrderByGroup(req.params['groupId'], req.query)
            .then(({data, code}) => {
                return res.status(code).send(data);
            })
            .catch(({err, code}) => {
                return res.status(code).send(err);
            });
    });
};