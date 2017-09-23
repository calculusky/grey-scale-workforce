/**
 * @author Paul Okeke
 * Created by paulex on 7/4/17.
 */


"use strict";
const MapperFactory = require('../../../MapperFactory');
const Password = require('../../../../core/Utility/Password');
const jwt = require("jsonwebtoken");
const Util = require('../../../../core/Utility/MapperUtil');

/**
 * @name RecognitionService
 */
class RecognitionService {

    constructor(context) {
        this.context = context;
    }

    login(username, password) {

        let [valid, , cMsg] = Util.validatePayLoad({username, password}, ["username", "password"]);

        if (!valid) return Promise.reject(Util.buildResponse({status: "fail", data: cMsg}, 400));

        if (typeof username !== 'string' || typeof password !== 'string') {
            return Promise.reject(Util.buildResponse({
                status: "fail", data: {
                    message: "Unauthorized",
                    description: "Invalid format for username or password"
                }
            }, 400));
        }

        const executor = (resolve, reject)=> {
            const UserMapper = MapperFactory.build(MapperFactory.USER);
            UserMapper.findDomainRecord({by: "*_and", value: {username}})
                .then(({records})=> {
                    if (!records.length) {
                        return reject(Util.buildResponse({status: "fail", data: Util.authFailData("AUTH_CRED")}, 401));
                    }
                    //we expect that the user is only one so we pick the first
                    const user = records.shift();
                    //checks to see that the password supplied matches
                    if(!Password.equals(password, user.password)){
                        return reject(Util.buildResponse({status: "fail", data: Util.authFailData("AUTH_CRED")}, 401));
                    }
                    user.setPassword();

                    //The token should have the api_instance_id
                    let token = jwt.sign({
                        sub: user.id,
                        name: user.username,
                        api: user['api_instance_id']
                    }, "mySecretKeyFile");
                    delete user.firebase_token;
                    return resolve(Util.buildResponse({data: {token, user}}));
                }).catch(err=> {
                // Log.e();
                return reject(Util.buildResponse({
                    status: "error", msg: "An internal server error occurred.", type: "Server",
                    code: `${err.errno || err.name} - ${err.code}`
                }, 500));
            });
        };
        return new Promise(executor);
    }

    logout(body, who, API) {
        // API.users().unRegisterFcmToken();
    }

    /**
     * Use as a middleware on routes
     * @param req
     * @param res
     * @param next
     */
    auth(req, res, next) {
        const token = req.header('x-working-token');
        // console.log(req.headers);
        if (token) {
            jwt.verify(token, 'mySecretKeyFile', (err, decoded)=> {
                if (err) {
                    return res.status(401).send(Util.buildResponse({
                        status: 'fail',
                        data: {message: "Unauthorized Access", description: Util.jwtTokenErrorMsg(err)},
                        isRoute: false
                    }));
                }
                req.who = decoded;
                return next();
            });
        } else {
            return res.status(401).send(Util.buildResponse({
                status: 'fail',
                data: {
                    message: "Unauthorized Access",
                    description: "Unauthorized. Send a valid token on the header [x-working-token]"
                },
                isRoute: false
            }));
        }
    }

    getName() {
        return "recognitionService";
    }
}

module.exports = RecognitionService;