const DomainFactory = require('../../../DomainFactory');
let MapperFactory = null;
const ApiService = require('../../../ApiService');
const Utils = require('../../../../core/Utility/Utils');
const Error = require('../../../../core/Utility/ErrorUtils')();
const UserDataTable = require('../commons/UserDataTable');

/**
 * Created by paulex on 7/4/17.
 */

class UserService extends ApiService {
    constructor(context) {
        super(context);
        MapperFactory = this.context.modelMappers;
    }

    /**
     *
     * @param value {String|Number}
     * @param by {String}
     * @param who {Session}
     * @param offset {Number}
     * @param limit {Number}
     * @returns {Promise<{data?: *, code?: *}>}
     */
    async getUsers(value = '?', by = "id", who, offset = 0, limit = 10) {
        const UserMapper = MapperFactory.build(MapperFactory.USER);
        const fields = ['id', 'username', 'email', 'first_name', 'last_name', 'middle_name',
            'gender', 'mobile_no', 'alt_mobile_no', 'user_type', 'avatar', 'address_id',
            'last_login', 'assigned_to', 'created_by', 'created_at', 'deleted_at', 'group_id', 'location'
        ];
        const result = (await UserMapper.findDomainRecord({by, value, fields})).records;
        const items = result.map(user => {
            user.password = "";
            return user;
        });
        return Utils.buildResponse({data: {items}});
    }

    /**
     *
     * @param body {Object}
     * @param who {Session}
     * @param API {API}
     */
    async createUser(body = {}, who, API) {
        const User = DomainFactory.build(DomainFactory.USER);
        const user = new User(body);
        user.firebase_token = '[]';

        user.serializeAssignedTo();

        ApiService.insertPermissionRights(user, who);

        if (!user.validate()) return Promise.reject(Error.ValidationFailure(user.getErrors().all()));

        const pmUser = await API.workflows().createUser(user, who).catch(err => (Promise.reject(err)));

        user['wf_user_id'] = pmUser['USR_UID'];

        user.encryptPassword();

        const UserMapper = MapperFactory.build(MapperFactory.USER);

        const dbUser = await UserMapper.createDomainRecord(user, who).catch(err => {
            if (user['wf_user_id']) API.workflows().deleteUser({wf_user_id: user.wf_user_id});
            return Promise.reject(err);
        });

        onUserCreated(dbUser, body, who, API);

        return Utils.buildResponse({data: dbUser});
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
        const user = new User(body);

        user['avatar'] = (file) ? file.filename : null;

        user.encryptPassword();

        const model = (await this.context.db().table("users").where(by, value).select(['*'])).shift();

        if (!model) return Promise.reject(Error.RecordNotFound());

        user.updateAssignedTo(model.assigned_to);

        const [result] = await UserMapper.updateDomainRecord({by, value, domain: user}, who);

        onUserUpdated(result, body, who, API).catch(console.warn);

        API.workflows().updateUser(by, value, Object.assign({password: body.password}, user)).catch(console.error);

        return Utils.buildResponse({data: result});
    }

    /**
     * gets dataTable records
     *
     * @param body
     * @param who {Session}
     * @returns {Promise<IDtResponse>}
     */
    async getUserDataTableRecords(body, who) {
        const userDataTable = new UserDataTable(this.context.db(), MapperFactory.build(MapperFactory.USER), who);
        const editor = await userDataTable.addBody(body).make();
        return editor.data();
    }

    /**
     * Get User Permissions
     *
     * @param userId
     * @param who
     * @returns {Promise<{data?: *, code?: *}>}
     */
    async getUserPermissions(userId, who = {}) {
        const permission = await this.context.getKey(`permissions:${userId}`, true);
        return Utils.buildResponse({data: permission});
    }

    /**
     *
     * @param body
     * @param who {Session}
     * @param API {API}
     * @returns {Promise<*>}
     */
    async resetPassword(body = {}, who, API) {
        const PasswordReset = DomainFactory.build(DomainFactory.PASSWORD_RESET);
        const pwdReset = new PasswordReset(body);

        if (!pwdReset.validate()) return Promise.reject(Error.ValidationFailure(pwdReset.getErrors().all()));

        if (!(await pwdReset.validateToken(this.context.db(), body.email))) return Promise.reject(Error.InvalidPasswordResetToken);

        await this.updateUser("email", body.email, {password: pwdReset.password}, who, null, API).catch(e => (Promise.reject(e)));

        return Utils.buildResponse({data: pwdReset});
    }

    /**
     *
     * @param by
     * @param value
     * @param who {Session}
     * @param API {API}
     * @returns {*}
     */
    async deleteUser(by = "id", value, who, API) {
        const UserMapper = MapperFactory.build(MapperFactory.USER);
        const db = this.context.db();
        const authId = who.getAuthUser().getUserId();

        const user = (await db.table("users").where(by, value).select(['id', 'wf_user_id'])).shift();

        if (!user) return Promise.reject(Error.RecordNotFound());

        const rand = await Utils.random();
        const u = "username", e = "email", d = "deleted_by";
        db.raw(`update users set ${u} = CONCAT(${u}, ?), ${e} = CONCAT(?, ${e}), ${d}=${authId} where ${by} = ?`,
            [`_${rand}_deleted`, `${rand}_deleted_`, value]).then(() => {
            API.workflows().updateUser("id", user.id, {}).catch(console.warn);
        }).catch(console.error);

        return UserMapper.deleteDomainRecord({by, value}, true, who).then(() => {
            return Utils.buildResponse({data: {message: "User deleted"}});
        });
    }

    /**
     * Gets all attachments created by the specified user {@link @param userId}
     *
     * @param userId
     * @param offset
     * @param limit
     * @param who
     * @param API {API}
     * @returns {Promise<{data?: *, code?: *}>}
     */
    async getUserAttachments(userId, offset = 0, limit = 10, who, API) {
        const {data: {data: {items}}} = await API.attachments().getAttachments(userId, undefined, "created_by", who, offset, limit);
        return Utils.buildResponse({data: {items}});
    }

    /**
     * Gets all work-orders that is assigned to the specified user {@link @param userID}
     *
     * @param userId
     * @param query
     * @param who
     * @param API
     * @returns {Promise<{data?: *, code?: *}>}
     */
    async getUserWorkOrders(userId, query = {}, who, API) {
        query.assigned_to = userId;
        const {data: {data: {items}}} = await API.workOrders().getWorkOrders(query, who);
        return Utils.buildResponse({data: {items}});
    }

    /**
     *
     * @param userId
     * @param who
     * @param API
     * @param res
     * @returns {Promise<void>}
     */
    async getUserProfileImage(userId, who, API, res) {
        const user = (await this.context.db().table("users").where('id', userId).select(['avatar'])).shift();
        let rootPath = this.context.config.storage;
        return res.sendFile(`profile/${userId}/${user.avatar}`, {root: rootPath.path});
    }

    /**
     * Use to register a user fire-base token
     *
     * @param fcmToken
     * @param who {Session}
     * @returns {Promise.<User>|*}
     */
    async registerFcmToken(fcmToken, who) {
        const User = DomainFactory.build(DomainFactory.USER);
        const user = new User();
        user.firebase_token = fcmToken;
        //only a device owner can register his/her device then its compulsory to take the user id from the session
        const userId = who.getAuthUser().getUserId();
        const result = (await this.context.db().raw(
            "UPDATE users SET fire_base_token = JSON_ARRAY_APPEND(fire_base_token, '$', ?) WHERE users.id = ?",
            [fcmToken, userId]
        )).shift();

        if (result.changedRows < 1) return Promise.reject(Utils.buildResponse({status: "fail", data: user}, 400));

        return Utils.buildResponse({data: user});
    }


    /**
     * @param fcmToken
     * @param newToken
     * @returns {Promise<{data?: *, code?: *}>}
     */
    async unRegisterFcmToken(fcmToken, newToken) {
        const col = "fire_base_token";
        const users = await this.context.db().raw(
            `SELECT id, username, fire_base_token FROM users
                          WHERE JSON_CONTAINS(fire_base_token, '["${fcmToken}"]')`
        );

        for (const user of users) {
            const tokens = user['fire_base_token'];
            const index = (tokens) ? tokens.indexOf(fcmToken) : -1;

            if (index === -1) continue;

            if (newToken) {
                const updateVal = `JSON_REPLACE(${col}, '$[${index}]', ?) where users.id = ?`;
                await this.context.db().raw(`update users set ${col} = ${updateVal}`, [newToken, user.id]);
            } else {
                const updateValue = `JSON_REMOVE(${col}, '$[${index}]') where users.id = ?`;
                await this.context.db().raw(`update users set ${col} = ${updateValue}`, [user.id]);
            }
            delete user[col];
        }

        return Utils.buildResponse({data: users});
    }

}

/**
 *
 * @param dbUser
 * @param body
 * @param session {Session}
 * @param API {API}
 */
function onUserCreated(dbUser, body, session, API) {
    const group_id = dbUser.group_id;
    const backgroundTask = [API.activations().activateUser(dbUser.id, session)];
    if (body.roles) backgroundTask.push(API.roles().addUserToRole(body.roles, dbUser.id));
    if (group_id) {
        backgroundTask.push(
            API.groups().addUserToGroup({group_id, user_id: dbUser.id, wf_user_id: dbUser['wf_user_id']}, session, API)
        );
    }
    delete dbUser.password;
    return Promise.all(backgroundTask).catch(err => console.error('CreateUser', JSON.stringify(err)));
}

/**
 * Updates the user roles or groups if specified after an update
 *
 * @param user
 * @param body
 * @param who
 * @param API
 * @returns {Promise<void>}
 */
async function onUserUpdated(user, body, who, API) {
    const role_id = body.roles;
    const group_id = user.group_id;
    if (role_id) {
        const role = (await user.roles()).records.shift();
        if (role) API.roles().updateUserRole(user.id, role.id, {role_id}, who, API).catch(console.error);
        else API.roles().addUserToRole(role_id, user.id).catch(console.error);
    }
    if (group_id) {
        const group = (await user.userGroups()).records.pop();
        if (group) {
            user['old_group_id'] = group.id;
            API.groups().updateUserGroup(user.id, group.id, {group_id}, who, API).catch(console.error);
        } else API.groups().addUserToGroup({user_id: user.id, group_id}, who, API).catch(console.error);
    }
}

module.exports = UserService;
