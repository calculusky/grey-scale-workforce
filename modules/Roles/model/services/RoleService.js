const ApiService = require('../../../ApiService');
const DomainFactory = require('../../../DomainFactory');
let MapperFactory = null;
const Utils = require('../../../../core/Utility/Utils');
const validate = require('validatorjs');
const Error = require('../../../../core/Utility/ErrorUtils')();
const Events = require('../../../../events/events');


/**
 * @name RoleService
 * Created by paulex on 2/28/18.
 */
class RoleService extends ApiService {

    constructor(context) {
        super(context);
        MapperFactory = this.context.modelMappers;
    }


    getRoles(value, by = "id", who = {api: -1}, offset = 0, limit = 10) {
        const RoleMapper = MapperFactory.build(MapperFactory.ROLE);
        const executor = (resolve, reject) => {
            RoleMapper.findDomainRecord({by, value}, offset, limit)
                .then(result => {
                    let groups = result.records;
                    let processed = 0;
                    let rowLen = groups.length;

                    groups.forEach(group => {
                        group.user().then(res => {
                            group.user = res.records.shift();
                            if (++processed === rowLen)
                                return resolve(Utils.buildResponse({data: {items: result.records}}));
                        }).catch(err => {
                            return reject(err)
                        })
                    })
                })
                .catch(err => {
                    return reject(err);
                });
        };
        return new Promise(executor)
    }

    /**
     * Creates a new role
     *
     * @param body
     * @param who
     */
    createRole(body = {}, who = {}) {
        const Role = DomainFactory.build(DomainFactory.ROLE);
        let role = new Role(body);

        let validator = new validate(role, role.rules(), role.customErrorMessages());

        if (validator.fails()) return Promise.reject(Error.ValidationFailure(validator.errors.all()));

        ApiService.insertPermissionRights(role, who);

        const [valid, json] = Utils.isJson(role.permissions);
        if (valid) role.permissions = JSON.stringify(json);

        //Get Mapper
        const RoleMapper = MapperFactory.build(MapperFactory.ROLE);
        return RoleMapper.createDomainRecord(role).then(role => {
            if (!role) return Promise.reject();
            return Utils.buildResponse({data: role});
        });
    }

    /**
     *
     * @param value
     * @param body
     * @param who
     * @param by
     */
    async updateRole(value, body = {}, who, by = "id") {
        const Role = DomainFactory.build(DomainFactory.ROLE);
        const RoleMapper = MapperFactory.build(MapperFactory.ROLE);

        const model = (await RoleMapper.findDomainRecord({by, value})).records.shift();

        if (!model) return Promise.reject(Error.RecordNotFound("Role not found."));

        const domain = new Role(body);

        const newAssignee = Utils.serializeAssignedTo(domain.assigned_to);

        const [valid, json] = Utils.isJson(domain.permissions);
        if (valid) domain.permissions = JSON.stringify(json);

        if (domain.assigned_to) domain.assigned_to = Utils.updateAssigned(model.assigned_to, newAssignee);

        return RoleMapper.updateDomainRecord({by, value, domain}).then(res => {
            if (!res.mLast()) return Error.RecordNotFound();
            Events.emit("role_updated", domain, who, model);
            return Utils.buildResponse({data: res.shift()});
        });
    }

    /**
     * Adds a user to a role
     *
     * @param roleId - The Role ID
     * @param userId - The User ID
     * @param who
     * @param API
     */
    async addUserToRole(roleId, userId, who = {}, API) {
        let user_roles = {role_id: roleId, user_id: userId};

        Utils.numericToInteger(user_roles, 'role_id', 'user_id');

        const validator = new validate(user_roles, {user_id: 'integer|required', role_id: 'integer|required'});

        if (validator.fails()) {
            console.error(validator.errors.all());
            return Promise.reject(Utils.buildResponse({
                status: "fail",
                data: validator.errors.all(),
                code: 'VALIDATION_ERROR'
            }, 400));
        }

        let date = Utils.date.dateToMysql(new Date(), 'YYYY-MM-DD H:m:s');
        user_roles.created_at = date;
        user_roles.updated_at = date;

        const db = this.context.database;
        const resp = await db.table("role_users").insert(user_roles).catch(console.error);

        return Utils.buildResponse({data: resp});
    }

    /**
     *
     * @param userId
     * @param oldRoleId
     * @param body
     * @param who
     * @param API {API}
     * @returns {Promise<void>|*}
     */
    async updateUserRole(userId, oldRoleId, body = {role_id: null}, who = {}, API) {
        if (oldRoleId === body.role_id) return true;
        const db = this.context.database;
        let date = Utils.date.dateToMysql(new Date(), 'YYYY-MM-DD H:m:s');
        const user_roles = {'role_id': body.role_id, updated_at: date};
        return await db.table("role_users").where('role_id', oldRoleId)
            .where('user_id', userId).update(user_roles).catch(console.error);
    }

    async detachUserFromRole(roleId, userId, who = {}) {
        return await this.context.database.table("role_users").where('role_id', roleId)
            .where('user_id', userId).del();
    }


    /**
     *
     * @param by
     * @param value
     * @returns {*}
     */
    deleteRole(by = "id", value) {
        const RoleMapper = MapperFactory.build(MapperFactory.ROLE);
        return RoleMapper.deleteDomainRecord({by, value}).then(count => {
            if (!count) {
                return Utils.buildResponse({status: "fail", data: {message: "The specified record doesn't exist"}});
            }
            return Utils.buildResponse({data: {by, message: "Role deleted"}});
        });
    }
}

module.exports = RoleService;