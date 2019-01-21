const ApiService = require('../../../ApiService');
const DomainFactory = require('../../../DomainFactory');
const Utils = require('../../../../core/Utility/Utils');
const Error = require('../../../../core/Utility/ErrorUtils')();
const validate = require('validatorjs');
const Events = require('../../../../events/events');
const GroupDataTable = require('../commons/GroupDataTable');
let MapperFactory = null;


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
    getGroup(value, by = "id", who = {api: -1}, offset = 0, limit = 10) {
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

        if (!group.validate()) return Promise.reject(Error.ValidationFailure(group.getErrors().all()));

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

        Events.emit("update_groups");

        return Utils.buildResponse({data: dbGroup});
    }

    /**
     *
     * @param body
     * @param who
     */
    linkGroup(body = {}, who = {}) {
        //look for multiples
        console.log(body);
        let multi = (body.multi) ? body.multi : [];
        delete body.multi;

        multi.push(body);
        let errors = [];

        let date = Utils.date.dateToMysql();
        multi = multi.map(item => {
            Utils.numericToInteger(item, "parent_id", "child_id");
            let validator = new validate(item, {'parent_id': 'required|integer', 'child_id': 'required|integer'});
            if (validator.passes()) {
                if (item.parent_id === item.child_id) errors.push("parent_id and child_id cannot be the same");
                return {
                    parent_group_id: item['parent_id'],
                    child_group_id: item['child_id'],
                    created_at: date,
                    updated_at: date,
                };
            }
            errors.push(validator.errors.all());
            return undefined;
        }).filter(item => item !== undefined && (item.parent_group_id !== item.child_group_id));

        if (!multi.length) return Promise.reject(Utils.buildResponse({status: 'fail', data: errors.shift()}, 400));

        const executor = (resolve, reject) => {
            return this.context.database('group_subs').insert(multi).then(r => {
                return resolve(Utils.buildResponse({data: r}));
            }).catch(err => {
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

        if (validator.fails()) return Promise.reject(Error.ValidationFailure(validator.errors.all()));

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
     * Updates a user group
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
     * Updates a group
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
        return GroupMapper.updateDomainRecord({value, domain}, who).then(() => {
            const db = this.context.database;
            domain.id = value;
            const backgroundTask = [API.workflows().updateGroup(Object.assign({}, domain))];
            if (parent_group_id) {
                db.table("group_subs").where('child_group_id', value).update({parent_group_id}).then(updated => {
                    if (!updated) this.linkGroup({child_id: domain.id, parent_id: parent_group_id}, who);
                });
            }
            Promise.all(backgroundTask).catch(console.error);
            Events.emit("update_groups");
            return Utils.buildResponse({data: domain});
        });
    }

    async getGroups(query = {}, who = {}) {
        const {name, type, offset = 0, limit = 10} = query;
        const groups = await Utils.getFromPersistent(this.context, "groups", true);
        console.log(groups);
        let items = [];
        Object.entries(groups).forEach(([key, value]) => {
            if (type && !type.split(",").map(i => i.toLowerCase()).includes(`${value['type']}`.toLowerCase())) return;
            if (name && value['name'].toLowerCase().indexOf(name.toLowerCase()) === -1) return;
            items.push(value);
        });
        if (offset || limit) items = items.slice(offset, offset + limit);
        return Utils.buildResponse({data: {items: items}});
    }

    /**
     * Get all the children of a group
     *
     * @param groupId
     * @returns {Promise<{data?: *, code?: *}>}
     */
    async getGroupChildren(groupId) {
        const groups = await Utils.getFromPersistent(this.context, "groups", true);
        const {children: items, ids} = Utils.getGroupChildren(groups[groupId]);
        return Utils.buildResponse({data: {items, ids}});
    }

    /**
     *
     * @param value
     * @returns {Promise<*|>}
     */
    async getGroupUsers(value) {
        const GroupMapper = MapperFactory.build(MapperFactory.GROUP);
        const group = (await GroupMapper.findDomainRecord({value, fields: ["id"]})).records.shift();
        if (!group) return Promise.reject(Error.RecordNotFound(`The group record "${value}" doesn't exist.`));
        return (await group.users()).records;
    }

    /**
     * For getting dataTable records
     *
     * @param body
     * @param who
     * @returns {Promise<IDtResponse>}
     */
    async getGroupTableRecords(body, who) {
        const roleDataTable = new GroupDataTable(this.context.database, MapperFactory.build(MapperFactory.GROUP));
        const editor = await roleDataTable.addBody(body).make();
        return editor.data();
    }


    /**
     * Confirms if a group exist
     *
     * @param groupId
     * @returns {Promise<*>}
     */
    async isGroupIdValid(groupId) {
        const groups = await this.context.getKey("groups", true);
        return (groups) ? groups[groupId] : null;
    }


    /**
     *
     * @param by
     * @param value
     * @param who
     * @param API {API}
     * @returns {*}
     */
    deleteGroup(by = "id", value, who, API) {
        const GroupMapper = MapperFactory.build(MapperFactory.GROUP);
        const db = this.context.database;

        Utils.random((r) => {
            db.raw(`update groups set name = CONCAT(name, ?) where ${by} = ?`, [`_${r}_deleted`, value]).then(() => {
                API.workflows().updateGroup(Object.assign({}, {id: value})).catch(console.error);
            }).catch(console.error);
        });

        return GroupMapper.deleteDomainRecord({by, value}, undefined, who).then(count => {
            if (!count) {
                return Utils.buildResponse({status: "fail", data: {message: "The specified record doesn't exist"}});
            }
            Events.emit("update_groups");
            return Utils.buildResponse({data: {by, message: "Group deleted"}});
        });
    }
}

module.exports = GroupService;