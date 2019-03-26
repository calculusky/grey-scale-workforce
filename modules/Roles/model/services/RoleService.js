const ApiService = require('../../../ApiService');
const DomainFactory = require('../../../DomainFactory');
let MapperFactory = null;
const Utils = require('../../../../core/Utility/Utils');
const validate = require('validatorjs');
const Error = require('../../../../core/Utility/ErrorUtils')();
const Events = require('../../../../events/events');
const RoleDataTable = require('../commons/RoleDataTable');


/**
 * @name RoleService
 * Created by paulex on 2/28/18.
 */
class RoleService extends ApiService {

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
    async getRoles(value, by = "id", who, offset = 0, limit = 10) {
        const RoleMapper = MapperFactory.build(MapperFactory.ROLE);
        const roles = (await RoleMapper.findDomainRecord({by, value}, offset, limit)).records;
        return Utils.buildResponse({data: {items: roles}});
    }

    /**
     * Creates a new role
     *
     * @param body {Object}
     * @param who {Session}
     */
    createRole(body = {}, who) {
        const Role = DomainFactory.build(DomainFactory.ROLE);
        const role = new Role(body);

        if (!role.validate()) return Promise.reject(Error.ValidationFailure(role.getErrors().all()));

        ApiService.insertPermissionRights(role, who);

        const RoleMapper = MapperFactory.build(MapperFactory.ROLE);
        return RoleMapper.createDomainRecord(role, who).then(role => {
            if (!role) return Promise.reject();
            return Utils.buildResponse({data: role});
        });
    }

    /**
     * TODO check that the permission is a string-object literal
     *
     * @param value {String|Number}
     * @param body {Object}
     * @param who {Session}
     * @param by {String}
     */
    async updateRole(value, body = {}, who, by = "id") {
        const Role = DomainFactory.build(DomainFactory.ROLE);
        const RoleMapper = MapperFactory.build(MapperFactory.ROLE);
        const model = (await RoleMapper.findDomainRecord({by, value})).records.shift();

        if (!model) return Promise.reject(Error.RecordNotFound("Role not found."));

        const role = new Role(body);

        role.updateAssignedTo(model.assigned_to);

        return RoleMapper.updateDomainRecord({by, value, domain: role}, who).then(res => {
            if (!res[1]) return Error.RecordNotFound();
            Events.emit("role_updated", role, who, model);
            return Utils.buildResponse({data: res.shift()});
        });
    }

    /**
     * Adds a user to a role
     *
     * @param roleId - The Role ID
     * @param userId - The User ID
     * @param who {Session}
     * @param API {API}
     */
    async addUserToRole(roleId, userId, who, API) {
        const user_roles = {role_id: roleId, user_id: userId};

        Utils.numericToInteger(user_roles, 'role_id', 'user_id');

        const validator = new validate(user_roles, {user_id: 'integer|required', role_id: 'integer|required'});

        if (validator.fails(null)) return Promise.reject(Error.ValidationFailure(validator.errors.all()));

        const date = Utils.date.dateToMysql();
        user_roles.created_at = date;
        user_roles.updated_at = date;

        await this.context.db()("role_users").insert(user_roles).catch(e => {
            return Promise.reject(Utils.getMysqlError(e));
        });

        return Utils.buildResponse({data: user_roles});
    }

    /**
     * Updates a user role
     *
     * @param userId {Number} - The user id
     * @param oldRoleId {Number} - The id the user was initially assigned to
     * @param body {Object}
     * @param who {Session}
     * @param API {API}
     * @returns {Promise<void>|*}
     */
    async updateUserRole(userId, oldRoleId, body = {role_id: null}, who, API) {
        if (!userId) throw new Error("userId is required.");
        if (!oldRoleId) throw new Error("oldRoleId is required.");
        if (oldRoleId === body.role_id) return true;
        const user_roles = {'role_id': body.role_id, updated_at: Utils.date.dateToMysql()};
        return await this.context.db()("role_users").where('role_id', oldRoleId)
            .where('user_id', userId).update(user_roles).catch(console.error);
    }

    /**
     * For getting dataTable records
     *
     * @param body {Object}
     * @param who {Session}
     * @returns {Promise<IDtResponse>}
     */
    async getRoleTableRecords(body, who) {
        const roleDataTable = new RoleDataTable(this.context.db(), MapperFactory.build(MapperFactory.ROLE), who);
        const editor = await roleDataTable.addBody(body).make();
        return editor.data();
    }

    /**
     *
     * @param by {String}
     * @param value {String|Number}
     * @param who {Session}
     * @returns {*}
     */
    deleteRole(by = "id", value, who) {
        const RoleMapper = MapperFactory.build(MapperFactory.ROLE);
        return RoleMapper.deleteDomainRecord({by, value}, true, who).then(count => {
            if (!count) return Promise.reject(Error.RecordNotFound());
            return Utils.buildResponse({data: {message: "Role deleted successfully."}});
        });
    }
}

module.exports = RoleService;