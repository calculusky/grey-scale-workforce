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
    /**
     * @name Session
     */
    class Session {
        /**
         *
         * @param token {String}
         * @param extras {Object}
         * @param user {User}
         * @param authUser {AuthUser}
         * @param expiryTime {Number}
         * @param permittedGroups {Array}
         */
        constructor(token, extras, user, authUser, expiryTime, permittedGroups) {
            Object.defineProperties(this, {
                "token": {value: token, writable: false},
                "extras": {value: extras, writable: false},
                "user": {value: user, writable: false},
                "authUser": {value: authUser, writable: false},
                "expiryTime": {value: expiryTime, writable: false},
                "permittedGroups": {value: permittedGroups, writable: false}
            })
        }

        getToken() {
            return this.token;
        };

        getExtras() {
            return this.extras;
        }

        getExtraKey(key) {
            return this.extras[key];
        }

        getUser() {
            return this.user;
        }

        getAuthUser() {
            return this.authUser;
        }

        getExpiryTime() {
            return Math.floor(Date.now() / 1000) + this.expiryTime;
        };

        /**
         * Get list of groups authenticated for this session
         * Comprises both the users group and all groups directly related to the user group
         *
         * @return {*}
         */
        getPermittedGroups() {
            return this.permittedGroups;
        }
    }

    /**
     *
     * @param context
     * @returns {{setUser: (function(User): Session.Builder), setExpiry: (function(Number): Session.Builder), build: (function(): Session)}}
     * @constructor
     */
    Session.Builder = function (context) {
        let token,
            /**
             * @type User
             */
            user,
            expiryTime = 3600 * 3600,
            permittedGroups,
            extras = {};
        const authUser = new AuthUser({});
        return {
            /**
             *
             * @param _user {User} - The authorized user in which a session is needed
             * @returns {Session.Builder}
             */
            setUser: function (_user) {
                if (!_user) return this;
                user = _user;
                authUser.setUserId(_user.id);
                authUser.setUsername(_user.username || null);
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
                if (value) extras[key] = value;
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

                        const authUser = new AuthUser(user);

                        permittedGroups = flatten(decoded.group.map(id => {
                            return (({ids}) => ids)(Utils.getGroupChildren(groups[id]))
                        }));
                        permittedGroups.push(...decoded.group);

                        authUser.setGroups(...decoded.group || []);
                        authUser.setPermission((permission) ? JSON.parse(permission) : {});
                        const session = new Session(_token, extras, user, authUser, expiryTime, permittedGroups);
                        return res(session);
                    });
                });
            },

            /**
             * @internal
             * @return {Promise<Session>}
             */
            default: async () => {
                if (user && user instanceof User) {
                    const task = [user.userGroups(), context.getKey("groups", true)];
                    const [userGroup = {records: []}, groups] = await Promise.all(task).catch(console.error);
                    authUser.setGroups((userGroup.records.length) ? userGroup.records.map(({id}) => id) : []);
                    permittedGroups = flatten(authUser.getGroups().map(id => {
                        return (({ids}) => ids)(Utils.getGroupChildren(groups[id]))
                    }));
                    permittedGroups.push(...authUser.getGroups());
                }
                return new Session(null, {}, user, authUser, expiryTime, permittedGroups);
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
                    const [userGroup = {records: []}, {records: [{permissions = "{}"}]}, groups] = await Promise.all(task).catch(err => {
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
                return new Session(token, extras, user, authUser, expiryTime, permittedGroups);
            }
        }
    };

    return Session;
})();
