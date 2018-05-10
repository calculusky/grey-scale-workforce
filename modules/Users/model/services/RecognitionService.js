/**
 * @author Paul Okeke
 * Created by paulex on 7/4/17.
 */


"use strict";
let MapperFactory = null;
const Password = require('../../../../core/Utility/Password');
const jwt = require("jsonwebtoken");
const Utils = require('../../../../core/Utility/Utils');
const ProcessAPI = require('../../../../processes/ProcessAPI');
const _ = require('lodash');
const useragent = require('useragent');

/**
 * @name RecognitionService
 */
class RecognitionService {

    constructor(context) {
        this.context = context;
        MapperFactory = this.context.modelMappers;
    }


    async login(username, password, req) {
        const userAgent = useragent.parse(req.headers['user-agent']);
        //TODO make use of the device key sent along the request payload console.log(req.headers['device']);
        // const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        let isMobile = Utils.isMobile(userAgent.family);

        let [valid, , cMsg] = Utils.validatePayLoad({username, password}, ["username", "password"]);

        if (!valid) return Promise.reject(Utils.buildResponse({status: "fail", data: cMsg}, 400));

        if (typeof username !== 'string' || typeof password !== 'string') {
            return Promise.reject(Utils.buildResponse({
                status: "fail", data: {
                    message: "Unauthorized",
                    description: "Invalid format for username or password"
                }
            }, 400));
        }

        const groups = await Utils.getFromPersistent(this.context, "groups", true);

        const executor = (resolve, reject) => {
            const UserMapper = MapperFactory.build(MapperFactory.USER);
            UserMapper.findDomainRecord({by: "*_and", value: {username}})
                .then(async ({records}) => {
                    if (!records.length) {
                        return reject(Utils.buildResponse({
                            status: "fail",
                            data: Utils.authFailData("AUTH_CRED")
                        }, 401));
                    }

                    const user = records.shift();
                    //checks to see that the password supplied matches
                    if (!Password.equals(password, user.password)) {
                        return reject(Utils.buildResponse({
                            status: "fail",
                            data: Utils.authFailData("AUTH_CRED")
                        }, 401));
                    }
                    user.setPassword();
                    //For Mobile we are giving 4months before token will expire
                    //but this token must be tied to the same user-agent and device
                    const tokenExpiry = (isMobile) ? 3600 * 3600 : 3600 * 3600;//TODO limit the time

                    const task = [user.userGroups(), user.roles()];
                    const [userGroup = {records: []}, {records: [{permissions}]}] = await Promise.all(task).catch(err => {
                        console.error(err);
                    });
                    //Login to process maker
                    const pmToken = await ProcessAPI.login(username, password).catch(e => {
                        console.error('UserPMLogin', e);
                    });
                    //TODO add permissions
                    const tokenOpt = {
                        sub: user.id,
                        aud: `${userAgent.family}`,
                        exp: Math.floor(Date.now() / 1000) + tokenExpiry,
                        name: user.username,
                        group: (userGroup.records.length) ? userGroup.records.map(({id}) => id) : [],
                        pmToken
                    };

                    console.log(tokenOpt);

                    //Get the permitted group this user belongs to
                    const permitted_groups = _.flatten(tokenOpt.group.map(id => ((({ids}) => ids)(Utils.getGroupChildren(groups[id])))));

                    let token = jwt.sign(tokenOpt, process.env.JWT_SECRET);
                    const persistence = this.context.persistence;
                    //Set up the token on redis server
                    persistence.set(token, true, 'EX', tokenExpiry);
                    persistence.set(`permissions:${user.id}`, (permissions) ? permissions : "{}", 'EX', tokenExpiry);

                    delete user.firebase_token;

                    return resolve(Utils.buildResponse({data: {token, user, permitted_groups}}));
                }).catch(err => {
                console.log(err);
                return reject(Utils.buildResponse({
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
            this.context.persistence.del(token);
            if (fireBaseToken && fireBaseToken.trim().length > 0) API.users().unRegisterFcmToken(fireBaseToken);
            return resolve(Utils.buildResponse({data: {token, user: {id: who.sub}}}));
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
            const persistence = this.context.persistence;
            persistence.get(token, (err, v) => {
                /*
                 * Check if the token exist on redis and the value is true.
                 * Can we assume that there wouldn't be any form off error here? No
                 * because for an unknown reason to us redis server can be down.
                 * So we should send 500 when there is an error
                 **/
                if (err) return res.status(500).send();
                if (!v || v !== 'true') return res.status(401).send(Utils.buildResponse(unAuthMsg));
                //Verify the JWT token
                jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
                    if (err) return res.status(401).send(Utils.buildResponse({
                        status: 'fail',
                        data: Utils.jwtTokenErrorMsg(err),
                        isRoute: false
                    }));

                    persistence.get(`permissions:${decoded.sub}`, (err, v) => {
                        decoded.permissions = (!err) ? JSON.parse(v) : {};
                        req.who = decoded;
                        return next();
                    });
                });
            });
        } else return res.status(401).send(Utils.buildResponse(unAuthMsg));
    }
}

module.exports = RecognitionService;