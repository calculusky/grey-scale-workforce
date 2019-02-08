/**
 * @author Paul Okeke
 * Created by paulex on 7/4/17.
 */
"use strict";
let MapperFactory = null;
const Password = require('../../../../core/Utility/Password');
const Utils = require('../../../../core/Utility/Utils');
const ProcessAPI = require('../../../../processes/ProcessAPI');
const Error = require('../../../../core/Utility/ErrorUtils')();
const AuthUser = require('../domain-objects/AuthUser');
const Session = require('../../../../core/Session');

/**
 * @name RecognitionService
 */
class RecognitionService {

    constructor(context) {
        this.context = context;
        MapperFactory = this.context.modelMappers;
    }

    /**
     *
     * @param username
     * @param password
     * @param req
     * @returns {Promise<*>}
     */
    async login(username, password, req) {
        const authUser = new AuthUser({username, password});

        if (!authUser.validate()) return Promise.reject(Error.ValidationFailure(authUser.getErrors().all()));

        const UserMapper = MapperFactory.build(MapperFactory.USER);

        const {records} = await UserMapper.findDomainRecord({by: "username", value: authUser.getUsername()});

        if (!records.length) return Promise.reject(Error.InvalidLogin);

        const user = records.shift();

        if (!Password.equals(password, user.password)) return Promise.reject(Error.InvalidLogin);

        const pmToken = await ProcessAPI.login(username, password).catch(e => {
            console.warn('UserPMLogin', e);
        });

        const session = await Session.Builder(this.context).setUser(user).addExtra("pmToken", pmToken).build()
            .catch(console.error);

        console.log(session);

        return Utils.buildResponse({
            data: {
                token: session.getToken(),
                user: session.getUser(),
                permitted_groups: session.getPermittedGroups()
            }
        });
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
            this.context.delKey(token);
            if (fireBaseToken && fireBaseToken.trim().length > 0) API.users().unRegisterFcmToken(fireBaseToken).then();
            return resolve(Utils.buildResponse({data: {token, user: {id: who.sub}}}));
        };
        return new Promise(executor);
    }

    /**
     * Use as a middleware on routes
     *
     * @param req
     * @param res
     * @param next
     */
    async auth(req, res, next) {
        const token = req.header('x-working-token');
        if (!token) return res.status(401).send(Utils.buildResponse(Error.UnAuthorizedAccess));

        req.who = await Session.Builder(this.context).validateToken(token).catch(err => {
            return (err) ? res.status(401).send(Utils.buildResponse({
                status: 'fail',
                data: Utils.jwtTokenErrorMsg(err),
                isRoute: false
            })) : res.status(401).send(Utils.buildResponse(Error.UnAuthorizedAccess));
        });

        return next();
    }
}

module.exports = RecognitionService;