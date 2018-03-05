const ApiService = require('../../../ApiService');
const DomainFactory = require('../../../DomainFactory');
let MapperFactory = null;
const Utils = require('../../../../core/Utility/Utils');
const validate = require('validate-fields')();

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

        let isValid = validate(role.rules(), role);

        if (!isValid) return Promise.reject(Utils.buildResponse({status: "fail", msg: validate.lastError}, 400));

        ApiService.insertPermissionRights(role, who);

        role.permissions = JSON.stringify(role.permissions);

        //Get Mapper
        const RoleMapper = MapperFactory.build(MapperFactory.ROLE);
        return RoleMapper.createDomainRecord(role).then(role => {
            if (!role) return Promise.reject();
            return Utils.buildResponse({data: role});
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
    addUserToRole(roleId, userId, who = {}, API) {
        let user_roles = {
            role_id: (!isNaN(roleId)) ? parseInt(roleId) : roleId,
            user_id: userId,
        };
        const isValid = validate({user_id: 'int', role_id: 'int'}, user_roles);

        if (!isValid) return Promise.reject(Utils.buildResponse({
                status: "fail", data: {message: validate.lastError}
            }, 400)
        );

        let date = new Date();
        user_roles.created_at = Utils.date.dateToMysql(date, 'YYYY-MM-DD H:m:s');
        user_roles.updated_at = Utils.date.dateToMysql(date, 'YYYY-MM-DD H:m:s');

        //Actually we need to check if the roleId exist and the userId exist
        const executor = (resolve, reject) => {
            let userExist = this.context.database.table("users").count("id as count").where("id", userId);
            let roleExist = this.context.database.table("roles").count("id as count").where("id", roleId);
            Promise.all([userExist, roleExist]).then(values => {
                let userCount = values.shift().shift();
                let roleCount = values.shift().shift();
                if (!userCount.count || !roleCount.count)
                    return reject(Utils.buildResponse({
                        status: "fail", data: {
                            message: `The ${(!userCount && !roleCount)
                                ? "The user_id and the role_id specified doesn't exist"
                                : (!userCount) ? "The user_id specified doesn't exist"
                                    : "The role_id specified doesn't exist."}`
                        }
                    }, 400));

                this.context.database.table("role_users").insert(user_roles)
                    .then(res => {
                        return resolve(Utils.buildResponse({data: res}));
                    })
                    .catch(err => {
                        //if the record already exist we should still return a success message
                        if (err.errno === 1062) return resolve(Utils.buildResponse({
                                msg: "Record already exist",
                                code: "DUPLICATE"
                            })
                        );
                        return reject(Utils.buildResponse({status: 'fail', data: Utils.getMysqlError(err)}, 400));
                    });
            });

        };
        return new Promise(executor);
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