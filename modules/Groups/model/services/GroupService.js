const ApiService = require('../../../ApiService');
const DomainFactory = require('../../../DomainFactory');
let MapperFactory = null;
const Utils = require('../../../../core/Utility/Utils');
const validate = require('validatorjs');

/**
 * @name GroupService
 * Created by paulex on 2/28/18.
 */
class GroupService extends ApiService {

    constructor(context) {
        super(context);
        MapperFactory = this.context.modelMappers;
    }


    /**
     *
     * @param value
     * @param by
     * @param who
     * @param offset
     * @param limit
     */
    getGroups(value, by = "id", who = {api: -1}, offset = 0, limit = 10) {
        const GroupMapper = MapperFactory.build(MapperFactory.GROUP);
        const executor = (resolve, reject) => {
            GroupMapper.findDomainRecord({by, value}, offset, limit)
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
                            return reject(err);
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
     * Create Group
     *
     * @param body
     * @param who
     * @param API {API}
     */
    async createGroup(body = {}, who = {}, API) {
        const Group = DomainFactory.build(DomainFactory.GROUP);
        let group = new Group(body);

        let validator = new validate(group, group.rules(), group.customErrorMessages());

        if (validator.fails()) {
            return Promise.reject(Utils.buildResponse({
                status: "fail",
                data: validator.errors.all(),
                code: 'VALIDATION_ERROR'
            }, 400));
        }

        ApiService.insertPermissionRights(group, who);

        const pmGroup = await API.workflows().createGroup(group).catch(err => {
            return Promise.reject(err);
        });

        group['wf_group_id'] = pmGroup['grp_uid'];

        const GroupMapper = MapperFactory.build(MapperFactory.GROUP);

        const dbGroup = await GroupMapper.createDomainRecord(group).catch(err => {
            if (group['wf_group_id']) API.workflows().deleteGroup(group['wf_group_id']).catch(console.error);
            return Promise.reject(err);
        });

        if (body['parent']) this.linkGroup({parent_id: body['parent'], child_id: group.id}).catch(console.error);

        return Utils.buildResponse({data: dbGroup});
    }

    /**
     *
     * @param body
     * @param who
     */
    linkGroup(body = {}, who = {}) {
        //look for multiples
        let multi = (body.multi) ? body.multi : [];
        delete body.multi;

        multi.push(body);
        let errors = [];

        let date = Utils.date.dateToMysql();
        multi = multi.map(item => {
            if (item.parent_id === item.child_id) errors.push("parent_id and child_id cannot be the same");
            Utils.numericToInteger(item, "parent_id", "child_id");
            if (validate({'parent_id': 'int', 'child_id': 'int'}, item))
                return {
                    parent_group_id: item['parent_id'],
                    child_group_id: item['child_id'],
                    created_at: date,
                    updated_at: date,
                };
            errors.push(validate.lastError);
        }).filter(item => item !== undefined && (item.parent_group_id !== item.child_group_id));

        if (!multi.length) return Promise.reject(Utils.buildResponse({status: 'fail', msg: errors}, 400));

        const executor = (resolve, reject) => {
            return this.context.database('group_subs').insert(multi)
                .then(r => {
                    return resolve(Utils.buildResponse({data: r}));
                })
                .catch(err => {
                    if (err.errno === 1062) return resolve(Utils.buildResponse({
                            msg: "Record already exist",
                            code: "DUPLICATE"
                        })
                    );
                    return reject(Utils.buildResponse({status: 'fail', data: Utils.getMysqlError(err)}, 400));
                });
        };
        return new Promise(executor);
    }

    /**
     * Adds a user to a group
     *
     * Note that for iforce this function doesn't allow you
     * add a user to multiple groups as at the time this was
     * written.
     *
     * @param body
     * @param who
     * @param API {API}
     */
    async addUserToGroup(body = {user_id: null, group_id, wf_user_id: null}, who, API) {
        const db = this.context.database;

        Utils.numericToInteger(body, "user_id", "group_id");

        const validator = new validate(body, {'user_id': 'integer|required', 'group_id': 'integer|required'});
        if (validator.fails()) {
            return Promise.reject(Utils.buildResponse({
                status: 'fail',
                data: validator.errors.all(),
                code: 'VALIDATION_ERROR'
            }, 400));
        }

        if (body.wf_user_id) await API.workflows().addUserToGroup(body.wf_user_id, body.group_id).catch(Promise.reject);
        else {
            let user = await db.table("users").where("id", body.user_id).select(['wf_user_id']);
            user = user.shift();
            if (user['wf_user_id']) await API.workflows().addUserToGroup(user.wf_user_id, body.group_id)
                .catch(Promise.reject);
        }

        let date = Utils.date.dateToMysql(new Date(), 'YYYY-MM-DD H:m:s');
        const data = {user_id: body.user_id, group_id: body.group_id, created_at: date, updated_at: date};

        let resp = await db.table("user_groups").insert(data).catch(err => {
            console.log(err);
            return Utils.buildResponse({status: 'fail', data: Utils.getMysqlError(err)}, 400);
        });
        return Utils.buildResponse({data: resp});
    }


    /**
     *
     * @param userId
     * @param oldGroupId
     * @param body
     * @param who
     * @param API {API}
     * @returns {Promise<*>}
     */
    async updateUserGroup(userId, oldGroupId, body = {group_id: null}, who = {}, API) {
        if (body.group_id === oldGroupId) return true;
        console.log(body.group_id, oldGroupId);
        const db = this.context.database;
        const user_groups = {'group_id': body.group_id, updated_at: Utils.date.dateToMysql()};

        let user = await db.table("users").where("id", userId).select(['wf_user_id']);
        if (!user.length) return false;

        user = user.shift();

        await API.workflows().removeUserFromGroup(user.wf_user_id, oldGroupId);
        await API.workflows().addUserToGroup(user.wf_user_id, body.group_id);

        return await db.table("user_groups").where('group_id', oldGroupId).where('user_id', userId)
            .update(user_groups).catch(console.error);
    }


    /**
     *
     * @param value
     * @param body
     * @param who
     * @param API {API}
     */
    updateGroup(value, body = {}, who = {}, API) {
        const Group = DomainFactory.build(DomainFactory.GROUP);
        const domain = new Group(body);
        const parent_group_id = (body['parent']) ? body['parent'] : null;

        const GroupMapper = MapperFactory.build(MapperFactory.GROUP);
        return GroupMapper.updateDomainRecord({value, domain}).then(() => {
            const db = this.context.database;
            domain.id = value;
            const backgroundTask = [API.workflows().updateGroup(Object.assign({}, domain))];
            if (parent_group_id) {
                let update = db.table("group_subs").where('child_group_id', value).update({parent_group_id});
                backgroundTask.push(update);
            }
            Promise.all(backgroundTask).catch(console.error);
            return Utils.buildResponse({data: domain});
        });
    }


    /**
     *
     * @param by
     * @param value
     * @returns {*}
     */
    deleteGroup(by = "id", value) {
        const GroupMapper = MapperFactory.build(MapperFactory.GROUP);
        //check if the group is referenced as a parent group or child on group_subs
        //TODO we need to be certain if the group is a parent; should we render all its child useless?
        return GroupMapper.deleteDomainRecord({by, value}).then(count => {
            if (!count) {
                return Utils.buildResponse({status: "fail", data: {message: "The specified record doesn't exist"}});
            }
            //delete on process maker
            return Utils.buildResponse({data: {by, message: "Group deleted"}});
        });
    }
}

module.exports = GroupService;