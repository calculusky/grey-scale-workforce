const DomainFactory = require('../../../DomainFactory');
let MapperFactory = null;
const Password = require('../../../../core/Utility/Password');
const Utils = require('../../../../core/Utility/Utils');
const validate = require('validate-fields')();
/**
 * Created by paulex on 7/4/17.
 */

class UserService {

    constructor(context) {
        this.context = context;
        MapperFactory = this.context.modelMappers;
    }

    getName() {
        return "userService";
    }

    getUsers(value = '?', by = "id", who = {api: -1}, offset = 0, limit = 10) {
        const UserMapper = MapperFactory.build(MapperFactory.USER);
        const executor = (resolve, reject)=> {
            UserMapper.findDomainRecord({by, value})
                .then(result=> {
                    //remove the password
                    let users = result.records;
                    let rowLen = users.length;
                    let processed = 0;
                    users.forEach(user=> {
                        user.password = "";
                        if (++processed == rowLen) return resolve(Utils.buildResponse({data: {items: users}}));
                    });
                    if (rowLen == 0) return resolve(Utils.buildResponse({data: {items: users}}));
                }).catch(err=> {
                return reject(err)
            });
        };
        return new Promise(executor)
    }

    /**
     *
     * @param body
     * @param who
     */
    createUser(body = {}, who = {}) {
        const User = DomainFactory.build(DomainFactory.USER);
        body['api_instance_id'] = who.api;
        let user = new User(body);

        //enforce the validation
        let isValid = validate(user.rules(), user);
        if (!isValid) {
            return Promise.reject(Utils.buildResponse({status: "fail", data: {message: validate.lastError}}, 400));
        }

        //Get Mapper
        if (user.password) {
            //replace the password prefix as well for laravel sake
            user.setPassword(Password.encrypt(user.password).hash.replace("$2a$", "$2y$"));
        }
        const UserMapper = MapperFactory.build(MapperFactory.USER);
        // console.log(user);
        return UserMapper.createDomainRecord(user).then(user=> {
            if (!user) return Promise.reject();
            delete user.password;
            return Utils.buildResponse({data: user});
        });
    }

    /**
     * Use to register a user fire-base token
     * @param fcmToken
     * @param who
     * @returns {Promise.<User>|*}
     */
    registerFcmToken(fcmToken, who = {}) {
        const User = DomainFactory.build(DomainFactory.USER);
        let user = new User();
        user.firebase_token = fcmToken;
        //since only a user can register his/her own device then its compulsory to
        //take the user id from the decoded token
        return this.context.database.raw(`update users set fire_base_token = 
        JSON_ARRAY_APPEND(fire_base_token, '$', ?) where users.id = ?`, [fcmToken, who.sub])
            .then(results=> {
                const result = results.shift();
                if (result.changedRows > 0) return Utils.buildResponse({data: user});
                //lets return error if nothing happened
                return Promise.reject(Utils.buildResponse({status: "fail", data: user}, 400));
            }).catch(err=> {
                const error = Utils.buildResponse(Utils.getMysqlError(err), 400);
                return Promise.reject(error)
            });
    }

    //don't expose
    unRegisterFcmToken(fcmToken, newFcmToken) {
        const executor = (resolve, reject)=> {
            let column = "fire_base_token";
            this.context.database.raw(`select id, username, fire_base_token from users where 
            JSON_CONTAINS(fire_base_token, '["${fcmToken}"]')`)
                .then(results=> {
                    let users = results.shift();
                    users.forEach(user=> {
                        const tokens = user['fire_base_token'];
                        const index = tokens.indexOf(fcmToken);
                        //if the newFcmToken is supplied we are do a replace else a remove
                        if (newFcmToken) {
                            const updateValue = `JSON_REPLACE(${column}, '$[${index}]', ?) where users.id = ?`;
                            this.context.database.raw(`update users set ${column} = ${updateValue}`, [newFcmToken, user.id])
                                .then(result=> {
                                    console.log(`Replace an FCMToken of user with id ${user.id}`);
                                    return resolve(Utils.buildResponse({data: user}));
                                }).catch(err=> {
                                return reject(err);
                            });
                        } else {
                            const updateValue = `JSON_REMOVE(${column}, '$[${index}]') where users.id = ?`;
                            this.context.database.raw(`update users set ${column} = ${updateValue}`, [user.id])
                                .then(result=> {
                                    console.log(`Remove an FCMToken from user with id ${user.id}`);
                                    return resolve(Utils.buildResponse({data: user}));
                                }).catch(err=> {
                                return reject(err);
                            });
                        }
                    });
                    if (users && users.length == 0) return resolve();
                })
        };
        return new Promise(executor);
    }

    /**
     *
     * @param by
     * @param value
     * @param body
     * @returns {Promise.<User>|*}
     */
    updateUser(by, value, body = {}) {
        const User = DomainFactory.build(DomainFactory.USER);
        let user = new User(body);
        const UserMapper = MapperFactory.build(MapperFactory.USER);

        return UserMapper.updateDomainRecord({value, domain: user}).then(result=> {
            if (result.pop()) {
                return Utils.buildResponse({data: result.shift()});
            } else {
                return Promise.reject(Utils.buildResponse({status: "fail", data: result.shift()}, 404));
            }
        });
    }

    /**
     *
     * @param by
     * @param value
     * @returns {*}
     */
    deleteUser(by = "id", value) {
        const UserMapper = MapperFactory.build(MapperFactory.USER);
        return UserMapper.deleteDomainRecord({by, value}).then(count=> {
            if (!count) {
                return Utils.buildResponse({status: "fail", data: {message: "The specified record doesn't exist"}});
            }
            return Utils.buildResponse({data: {message: "User deleted"}});
        });
    }
}

module.exports = UserService;