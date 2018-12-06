const DomainFactory = require('../../../DomainFactory');
let MapperFactory = null;
const ApiService = require('../../../ApiService');
const Password = require('../../../../core/Utility/Password');
const Utils = require('../../../../core/Utility/Utils');
const Error = require('../../../../core/Utility/ErrorUtils')();
const validate = require('validatorjs');

/**
 * Created by paulex on 7/4/17.
 */

class UserService extends ApiService {
    constructor(context) {
        super(context);
        MapperFactory = this.context.modelMappers;
    }

    getUsers(value = '?', by = "id", who = {}, offset = 0, limit = 10) {
        const UserMapper = MapperFactory.build(MapperFactory.USER);
        const executor = (resolve, reject) => {
            const fields = ['id', 'username', 'email', 'first_name', 'last_name', 'middle_name',
                'gender', 'mobile_no', 'alt_mobile_no', 'user_type', 'avatar', 'address_id',
                'last_login', 'assigned_to', 'created_by', 'created_at', 'deleted_at', 'group_id', 'location'
            ];
            UserMapper.findDomainRecord({by, value, fields})
                .then(result => {
                    //remove the password
                    let users = result.records;
                    console.log(users);
                    let rowLen = users.length;
                    let processed = 0;
                    users.forEach(user => {
                        user.password = "";
                        if (++processed === rowLen) return resolve(Utils.buildResponse({data: {items: users}}));
                    });
                    if (rowLen === 0) return resolve(Utils.buildResponse({data: {items: users}}));
                }).catch(err => {
                return reject(err)
            });
        };
        return new Promise(executor)
    }

    /**
     *
     * @param body
     * @param who
     * @param API {API}
     */
    async createUser(body = {}, who = {}, API) {
        const User = DomainFactory.build(DomainFactory.USER);
        const password = body['password'];
        let user = new User(body);
        user.firebase_token = '[]';

        user.assigned_to = Utils.serializeAssignedTo(user.assigned_to);

        //enforce the validation
        let validator = new validate(user, user.rules(), user.customErrorMessages());

        let group_id = null;
        // If the group_id is set, it means we are adding this user to a group
        // We'll be setting the group that created this user when we call :insertPermissionRights
        if (user.group_id) (group_id = user.group_id) && delete user.group_id;

        if (validator.fails()) {
            return Promise.reject(Utils.buildResponse({
                status: "fail",
                code: 'VALIDATION_ERROR',
                data: validator.errors.all()
            }, 400));
        }

        ApiService.insertPermissionRights(user, who);

        delete user.password;

        //Create the user on process maker first
        const pmUser = await API.workflows().createUser(Object.assign({password: password}, user), who).catch(err => {
            return Promise.reject(err);
        });

        user['wf_user_id'] = pmUser['USR_UID'];
        user['wf_user_pass'] = Utils.encrypt(password, process.env.JWT_SECRET);
        //replace the password prefix as well for laravel's sake
        user.setPassword(Password.encrypt(password).hash.replace("$2a$", "$2y$"));


        const UserMapper = MapperFactory.build(MapperFactory.USER);

        const dbUser = await UserMapper.createDomainRecord(user).catch(err => {
            if (user['wf_user_id']) API.workflows().deleteUser({wf_user_id: user.wf_user_id});
            return Promise.reject(err);
        });

        if (!dbUser) return Promise.reject(false/*TODO change to the right error format*/);

        const backgroundTask = [API.activations().activateUser(dbUser.id, who)];

        if (body.roles) backgroundTask.push(API.roles().addUserToRole(body.roles, dbUser.id));

        if (group_id) {
            backgroundTask.push(
                API.groups().addUserToGroup({group_id, user_id: dbUser.id, wf_user_id: dbUser['wf_user_id']}, who, API)
            );
        }

        Promise.all(backgroundTask).catch(err => console.error('CreateUser', JSON.stringify(err)));
        delete dbUser.password;
        return Utils.buildResponse({data: dbUser});
    }


    async updateUserPermissions(permissions, who = {}) {

    }

    /**
     * Get User Permissions
     *
     * @param userId
     * @param who
     * @returns {Promise<{data?: *, code?: *}>}
     */
    async getUserPermissions(userId, who = {}) {
        const permission = await Utils.getFromPersistent(this.context, `permissions:${userId}`, true);
        return Utils.buildResponse({data: permission});
    }

    /**
     * Use to register a user fire-base token
     *
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
            .then(results => {
                const result = results.shift();
                if (result.changedRows > 0) return Utils.buildResponse({data: user});
                //lets return error if nothing happened
                return Promise.reject(Utils.buildResponse({status: "fail", data: user}, 400));
            }).catch(err => {
                const error = Utils.buildResponse(Utils.getMysqlError(err), 400);
                return Promise.reject(error)
            });
    }

    //don't expose
    unRegisterFcmToken(fcmToken, newToken) {
        const executor = (resolve, reject) => {
            let column = "fire_base_token";
            this.context.database.raw(`select id, username, fire_base_token from users where 
            JSON_CONTAINS(fire_base_token, '["${fcmToken}"]')`)
                .then(results => {
                    let users = results.shift();
                    users.forEach(user => {
                        const tokens = user['fire_base_token'];
                        const index = tokens.indexOf(fcmToken);
                        //if the newFcmToken is supplied we are do a replace else a remove
                        if (newToken) {
                            const updateVal = `JSON_REPLACE(${column}, '$[${index}]', ?) where users.id = ?`;
                            this.context.database.raw(`update users set ${column} = ${updateVal}`, [newToken, user.id])
                                .then(result => {
                                    console.log(`Replace an FCMToken of user with id ${user.id}`);
                                    return resolve(Utils.buildResponse({data: user}));
                                }).catch(err => {
                                return reject(err);
                            });
                        } else {
                            const updateValue = `JSON_REMOVE(${column}, '$[${index}]') where users.id = ?`;
                            this.context.database.raw(`update users set ${column} = ${updateValue}`, [user.id])
                                .then(result => {
                                    console.log(`Remove an FCMToken from user with id ${user.id}`);
                                    return resolve(Utils.buildResponse({data: user}));
                                }).catch(err => {
                                return reject(err);
                            });
                        }
                    });
                    if (users && users.length === 0) return resolve();
                })
        };
        return new Promise(executor);
    }

    /**
     *
     * @param keyword
     * @param offset
     * @param limit
     * @returns {Promise<{data?: *, code?: *}>}
     */
    async searchUsers(keyword, offset = 0, limit = 10) {
        const User = DomainFactory.build(DomainFactory.USER);
        let fields = [
            'id',
            'username',
            'first_name',
            'email',
            'last_name',
            'gender',
            'avatar'
        ];
        let resultSets = this.context.database.select(fields).from('users')
            .where('username', 'like', `%${keyword}%`)
            .orWhere('first_name', 'like', `%${keyword}%`)
            .orWhere('email', 'like', `%${keyword}%`)
            .orWhere('last_name', 'like', `%${keyword}%`)
            .orWhere('middle_name', 'like', `%${keyword}%`)
            .where("deleted_at", null)
            .limit(parseInt(limit)).offset(parseInt(offset)).orderBy('first_name', 'asc');

        const results = await resultSets.catch(err => (Utils.buildResponse({status: "fail", data: err}, 500)));

        const users = results.map(item => new User(item));
        return Utils.buildResponse({data: {items: users}});
    }


    /**
     *
     * @param by
     * @param value
     * @param body
     * @param who
     * @param file
     * @param API {API}
     * @returns {Promise.<User>|*}
     */
    async updateUser(by, value, body = {}, who, file, API) {
        Utils.numericToInteger(body, 'roles', 'group_id');
        const User = DomainFactory.build(DomainFactory.USER);
        const UserMapper = MapperFactory.build(MapperFactory.USER);
        const role_id = body['roles'];
        const password = body.password;
        const cols = ['*'];
        let user = new User(body);
        let group_id = null;

        //If a file was uploaded lets update the user profile
        user['avatar'] = (file) ? file.filename : undefined;

        //If there is also a new password, we should update the password
        if (password) {
            user['wf_user_pass'] = Utils.encrypt(password, process.env.JWT_SECRET);
            user.setPassword(Password.encrypt(password).hash.replace("$2a$", "$2y$"));
        }

        //We shouldn't override the group that created the user
        if (body.group_id) (group_id = body.group_id) && (delete user.group_id);

        let model = await this.context.database.table("users").where(by, value).select(cols);

        if (!model.length) return Utils.buildResponse({status: "fail", data: {message: "User doesn't exist"}}, 400);

        model = new User(model.shift());

        const newAssignedTo = Utils.serializeAssignedTo(user.assigned_to);

        if (user.assigned_to) user.assigned_to = Utils.updateAssigned(model.assigned_to, newAssignedTo);

        return UserMapper.updateDomainRecord({value, domain: user}, who).then(async (result) => {
            if (result.pop()) {
                user[by] = value;
                if (role_id) {
                    let roles = await user.roles(), role = roles.records.shift();
                    if (role) API.roles().updateUserRole(user.id, role.id, {role_id}, who, API).catch(console.error);
                    else API.roles().addUserToRole(role_id, user.id).catch(console.error);
                }
                if (group_id) {
                    let userGroups = await user.userGroups(), group = userGroups.records.pop();
                    if (group) {
                        user['old_group_id'] = group.id;
                        API.groups().updateUserGroup(user.id, group.id, {group_id}, who, API).catch(console.error);
                    } else API.groups().addUserToGroup({user_id: user.id, group_id}, who, API).catch(console.error);
                }
                API.workflows().updateUser(by, value, Object.assign({password: password}, user)).catch(console.error);
                return Utils.buildResponse({data: result.shift()});
            } else {
                return Promise.reject(Utils.buildResponse({status: "fail", data: result.shift()}, 404));
            }
        });
    }


    /**
     *
     * @param body
     * @param who
     * @param API {API}
     * @returns {Promise<*>}
     */
    async resetPassword(body = {}, who = {}, API) {
        const rules = {
            email: 'email|required',
            password_confirmation: "string|required",
            password: "string|required",
            token: "string|required"
        };
        const pass = body.password;
        const validator = new validate(body, rules);

        if (validator.fails()) return Promise.reject(Error.ValidationFailure(validator.errors.all()));

        //check that the password conf and password are same
        if (pass !== body.password_confirmation)
            return Promise.reject(Error.ValidationFailure({password: ["The password and confirmed password doesn't match."]}));

        const db = this.context.database;

        let reset = await db.table("password_resets").where("email", body.email);

        if (!reset.length) return Promise.reject(Utils.buildResponse({
            status: "fail",
            msg: "Invalid Password Reset"
        }, 403));

        reset = reset.shift();

        if (!Password.equals(body.token, reset.token)) return Promise.reject(Utils.buildResponse({
            status: "fail",
            msg: "Invalid Token or Token has expired"
        }, 403));

        const UserMapper = MapperFactory.build(MapperFactory.USER);
        const User = DomainFactory.build(DomainFactory.USER);
        const user = new User({});

        db.table("password_resets").where("email", body.email).del().then();

        user.setPassword(Password.encrypt(body.password).hash.replace("$2a$", "$2y$"));
        user['wf_user_pass'] = Utils.encrypt(body.password, process.env.JWT_SECRET);

        let update = await UserMapper.updateDomainRecord({by: "email", value: body.email, domain: user}, who);
        update = update.slice(-1).shift();
        if (!update) return Promise.reject(Utils.buildResponse({status: 'fail', msg: "User doesn't exist"}, 400));

        API.workflows().updateUser("email", body.email, {password: pass}).catch(console.error);

        return Utils.buildResponse({});
    }

    /**
     *
     * @param by
     * @param value
     * @param who
     * @param API {API}
     * @returns {*}
     */
    async deleteUser(by = "id", value, who, API) {
        // ApiService.checkPermissions('users.delete');
        const UserMapper = MapperFactory.build(MapperFactory.USER);
        const db = this.context.database;

        //Because we need to delete this user also on process maker
        //We'd have to read the user table to get the wf_user_id.
        //Ideally we should delete the record straight
        let user = (await db.table("users").where(by, value).select(['id', 'wf_user_id'])).shift();

        //We can quickly return to the developer that the record doesn't exist
        if (!user) return Error.RecordNotFound();

        const rand = await Utils.random();
        const u = "username", e = "email", d = "deleted_by";
        db.raw(`update users set ${u} = CONCAT(${u}, ?), ${e} = CONCAT(?, ${e}), ${d}=${who.sub} where ${by} = ?`,
            [`_${rand}_deleted`, `${rand}_deleted_`, value]).then(() => {
            API.workflows().updateUser("id", user.id, {}).catch(console.error);
        }).catch(console.error);

        return UserMapper.deleteDomainRecord({by: "id", value: user.id}, true, who).then(() => {
            return Utils.buildResponse({data: {message: "User deleted"}});
        });
    }

    /**
     *
     * @param userId
     * @param offset
     * @param limit
     * @param who
     * @param API {API}
     * @returns {Promise<{data?: *, code?: *}>}
     */
    async getUserAttachments(userId, offset=0, limit=10, who, API) {
        let {data:{data:{items}}} = await API.attachments().getAttachments(userId, undefined, "created_by", who, offset, limit);
        return Utils.buildResponse({data:{items}});
    }

    /**
     *
     * @param userId
     * @param query
     * @param who
     * @param API
     * @returns {Promise<{data?: *, code?: *}>}
     */
    async getUserWorkOrders(userId, query={}, who, API){
        query.assigned_to = userId;
        let {data:{data:{items}}} = await API.workOrders().getWorkOrders(query, who);
        return Utils.buildResponse({data:{items}});
    }
}

module.exports = UserService;
