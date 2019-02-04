const jwt = require('jsonwebtoken');
const AuthUser = require('../modules/Users/model/domain-objects/AuthUser');
const {flatten} = require('lodash');
const Utils = require('./Utility/Utils');
const User = require('../modules/Users/model/domain-objects/User');

/**
 * @author Paul Okeke
 * Date: 21/01/2019
 * @type {Session}
 */
module.exports = (function () {
    let token,
        user,
        authUser,
        expiryTime = 3600 * 3600,
        permittedGroups,
        extras = {};

    function _setUser(u) {
        user = u;
    }

    function setAuthUser(aUser) {
        authUser = aUser;
    }

    /**
     * @name Session
     */
    class Session {
        constructor() {
        }

        getToken() {
            return token;
        };

        getExtras(){
            return extras;
        }

        getExtraKey(key){
            return extras[key];
        }

        getUser() {
            return user;
        }

        getAuthUser() {
            return authUser;
        }

        getExpiryTime() {
            return Math.floor(Date.now() / 1000) + expiryTime;
        };

        /**
         * Get list of groups authenticated for this session
         * Comprises both the users group and all groups directly related to the user group
         *
         * @return {*}
         */
        getPermittedGroups() {
            return permittedGroups;
        }
    }

    /**
     *
     * @param context
     * @returns {{setUser: (function(User): Session.Builder), setExpiry: (function(Number): Session.Builder), build: (function(): Session)}}
     * @constructor
     */
    Session.Builder = function (context) {
        const session = new Session();
        const authUser = new AuthUser({});
        return {
            /**
             *
             * @param user {User} - The authorized user in which a session is needed
             * @returns {Session.Builder}
             */
            setUser: function (user) {
                if (!user) return this;
                _setUser(user);
                authUser.setUserId(user.id);
                authUser.setUsername(user.username || null);
                return this;
            },

            /**
             * @param time {Number} - Time this session should last for In milliseconds
             * @returns {Session.Builder}
             */
            setExpiry: function (time) {
                expiryTime = (time) ? time : expiryTime;
                return this;
            },

            /**
             * Add extra keys to the token being generated
             *
             * @param key
             * @param value
             * @returns {Session.Builder}
             */
            addExtra: function (key, value) {
                extras[key] = value;
                return this;
            },


            /**
             *
             * @param _token
             * @returns {Promise<Session|null>}
             */
            validateToken: async function (_token) {
                token = await context.getKey(_token);
                if (!token || token !== 'true') return null;
                return new Promise((res, rej) => {
                    jwt.verify(_token, process.env.JWT_SECRET, async (err, decoded) => {
                        if (err) return rej(err);
                        const [permission, groups] = await Promise.all([
                            context.getKey(`permissions:${decoded.sub}`),
                            context.getKey("groups", true)
                        ]);
                        user = {id: decoded.sub, username: decoded.name};
                        extras = decoded.extras;
                        expiryTime = decoded.exp;
                        token = _token;
                        const session = new Session();
                        const authUser = new AuthUser(user);

                        permittedGroups = flatten(decoded.group.map(id => {
                            return (({ids}) => ids)(Utils.getGroupChildren(groups[id]))
                        }));
                        permittedGroups.push(...decoded.group);

                        authUser.setGroups(...decoded.group || []);
                        authUser.setPermission((permission) ? JSON.parse(permission) : {});
                        setAuthUser(authUser);
                        return res(session);
                    });
                });
            },

            /**
             * Builds the session
             *
             * @returns {Promise<Session>}
             */
            build: async () => {
                token = {
                    sub: user.id,
                    exp: Math.floor(Date.now() / 1000) + expiryTime,
                    name: user.username,
                    extras
                };
                if (user && user instanceof User) {
                    const task = [user.userGroups(), user.roles(), context.getKey("groups", true)];
                    const [userGroup = {records: []}, {records: [{permissions="{}"}]}, groups] = await Promise.all(task).catch(err => {
                        console.error(err);
                    });
                    token.group = (userGroup.records.length) ? userGroup.records.map(({id}) => id) : [];

                    permittedGroups = flatten(token.group.map(id => {
                        return (({ids}) => ids)(Utils.getGroupChildren(groups[id]))
                    }));
                    permittedGroups.push(...token.group);

                    authUser.setPermission(JSON.parse(permissions));
                    context.setKey(`permissions:${user.id}`, (permissions) ? permissions : "{}", 'EX', expiryTime);
                }
                token = jwt.sign(token, process.env.JWT_SECRET);
                context.setKey(token, true, 'EX', expiryTime);
                setAuthUser(authUser);
                return session;
            }
        }
    };

    return Session;
})();
