/**
 * @author Paul Okeke
 * Created by paulex on 7/4/17.
 */


"use strict";
let MapperFactory = null;
const Password = require('../../../../core/Utility/Password');
const jwt = require("jsonwebtoken");
const Util = require('../../../../core/Utility/Utils');
const useragent = require('useragent');

/**
 * @name RecognitionService
 */
class RecognitionService {

    constructor(context) {
        this.context = context;
        MapperFactory = this.context.modelMappers;
    }

    login(username, password, req) {
        const userAgent = useragent.parse(req.headers['user-agent']);
        //TODO make use of the device key sent along the request payload console.log(req.headers['device']);
        // const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        let isMobile = Util.isMobile(userAgent.family);

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
                    if (!Password.equals(password, user.password)) {
                        return reject(Util.buildResponse({status: "fail", data: Util.authFailData("AUTH_CRED")}, 401));
                    }
                    user.setPassword();
                    //For Mobile we are giving 4months before token will expire
                    //but this token must be tied to the same user-agent and device
                    const tokenExpiry = (isMobile) ? 3600 * 3600 : 15 * 60;
                    const tokenOpt = {
                        sub: user.id,
                        aud: `${userAgent.family}`,
                        exp: Math.floor(Date.now() / 1000) + tokenExpiry,
                        name: user.username
                    };

                    let token = jwt.sign(tokenOpt, "mySecretKeyFile");
                    //Set up the token on redis server
                    this.context.persistence.set(token, true, 'EX', tokenExpiry);

                    delete user.firebase_token;
                    return resolve(Util.buildResponse({data: {token, user}}));
                }).catch(err=> {
                return reject(Util.buildResponse({
                    status: "error", msg: "An internal server error occurred.", type: "Server",
                    code: `${err.errno || err.name} - ${err.code}`
                }, 500));
            });
        };
        return new Promise(executor);
    }

    /**
     *
     * @param who
     * @param {API} API
     * @param req
     */
    logout(who, API, req) {
        const token = req.header('x-working-token');
        const fireBaseToken = req.headers['x-firebase-token'];
        const executor = (resolve, reject) => {
            //Let's ask, should we really care about the response of the two actions
            //We somehow know this will definitely always be called
            this.context.persistence.set(token, false);
            if (fireBaseToken && fireBaseToken.trim().length > 0) API.users().unRegisterFcmToken(fireBaseToken);
            return resolve(Util.buildResponse({data: {token, user: {id: who.sub}}}));
        };
        return new Promise(executor);
    }

    /**
     * Use as a middleware on routes
     * @param req
     * @param res
     * @param next
     */
    auth(req, res, next) {
        const userAgent = useragent.parse(req.headers['user-agent']);
        const token = req.header('x-working-token');
        const unAuthMsg = {
            status: 'fail',
            data: {
                message: "Unauthorized Access",
                description: "Unauthorized. Send a valid token on the header [x-working-token]"
            },
            isRoute: false
        };
        if (token) {
            this.context.persistence.get(token, (err, v)=> {
                /*
                 * Check if the token exist on redis and the value is true.
                 * Can we assume that there wouldn't be any form off error here? No
                 * because for an unknown reason to us redis server can be down.
                 * So we should send 500 when there is an error
                 **/
                if (err) return res.status(500).send();
                if (!v || v !== 'true')  return res.status(401).send(Util.buildResponse(unAuthMsg));
                jwt.verify(token, 'mySecretKeyFile', (err, decoded)=> {
                    if (err) return res.status(401).send(Util.buildResponse({
                        status: 'fail',
                        data: Util.jwtTokenErrorMsg(err),
                        isRoute: false
                    }));
                    /*
                     * lets also check that this token is coming from the right device
                     * If the token is coming from a different device which isn't the original device used to
                     * get this token we can flag it as un-authorize.
                     *
                     * There are probably more things we should be able to do here to make it more secured
                     **/
                    if (userAgent.family !== decoded.aud) return res.status(401).send(Util.buildResponse(unAuthMsg));
                    req.who = decoded;
                    return next();
                });
            });
        } else return res.status(401).send(Util.buildResponse(unAuthMsg));
    }

    getName() {
        return "recognitionService";
    }
}

module.exports = RecognitionService;