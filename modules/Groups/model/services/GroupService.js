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
     * @param who {Session}
     * @param offset
     * @param limit
     */
    async getGroup(value, by = "id", who, offset = 0, limit = 10) {
        const GroupMapper = MapperFactory.build(MapperFactory.GROUP);
        const {records: items} = await GroupMapper.findDomainRecord({by, value}, offset, limit);
        return Utils.buildResponse({data: {items}})
    }

    /**
     * Create Group
     *
     * @param body
     * @param who {Session}
     * @param API {API}
     */
    async createGroup(body = {}, who, API) {
        const Group = DomainFactory.build(DomainFactory.GROUP);
        let group = new Group(body);

        if (!group.validate()) return Promise.reject(Error.ValidationFailure(group.getErrors().all()));

        ApiService.insertPermissionRights(group, who);

        const pmGroup = await API.workflows().createGroup(group).catch(err => {
            return Promise.reject(err);
        });

        group['wf_group_id'] = pmGroup['grp_uid'];

        const GroupMapper = MapperFactory.build(MapperFactory.GROUP);

        const dbGroup = await GroupMapper.createDomainRecord(group, who).catch(err => {
            if (group['wf_group_id']) API.workflows().deleteGroup(group['wf_group_id']).catch(console.error);
            return Promise.reject(err);
        });

        if (body['parent']) this.linkGroup({parent_id: body['parent'], child_id: dbGroup.id}, who).catch(console.error);

        Events.emit("update_groups");

        return Utils.buildResponse({data: dbGroup});
    }

    /**
     *
     * @param body {Object}
     * @param who {Session}
     */
    linkGroup(body = {}, who) {
        let multi = (body.multi) ? body.multi : [];
        delete body.multi;

        multi.push(body);

        const errors = [];
        const date = Utils.date.dateToMysql();
        const rules = {'parent_id': 'required|integer', 'child_id': 'required|integer'};

        multi = multi.map(item => {
            Utils.numericToInteger(item, "parent_id", "child_id");
            const validator = new validate(item, rules);
            if (validator.passes(null)) {
                if (item.parent_id === item.child_id) {
                    errors.push("parent_id and child_id cannot be the same");
                    return;
                }
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
            return this.context.db()('group_subs').insert(multi).then(r => {
                return resolve(Utils.buildResponse({data: multi}));
            }).catch(err => {
                if (err.errno === 1062) return resolve(Utils.buildResponse({msg: "Record already exist", code: "DUPLICATE"}));
                return reject(Utils.buildResponse({status: 'fail', data: Utils.getMysqlError(err)}, 400));
            });
        };
        return new Promise(executor);
    }

    /**
     * Adds a user to a group
     *
     * Note that for iForce this function doesn't allow you
     * add a user to multiple groups as at the time this was
     * written.
     *
     * @param body
     * @param who
     * @param API {API}
     */
    async addUserToGroup(body = {user_id: null, group_id, wf_user_id: null}, who, API) {
        const db = this.context.db();

        Utils.numericToInteger(body, "user_id", "group_id");

        const validator = new validate(body, {'user_id': 'integer|required', 'group_id': 'integer|required'});

        if (validator.fails(null)) return Promise.reject(Error.ValidationFailure(validator.errors.all()));

        if (body.wf_user_id) await API.workflows().addUserToGroup(body.wf_user_id, body.group_id).catch(Promise.reject);
        else {
            const user = (await db.table("users").where("id", body.user_id).select(['wf_user_id'])).shift();
            if (user && user['wf_user_id']) await API.workflows().addUserToGroup(user.wf_user_id, body.group_id)
                .catch(Promise.reject);
        }
        const date = Utils.date.dateToMysql();
        const data = {user_id: body.user_id, group_id: body.group_id, created_at: date, updated_at: date};

        await db.table("user_groups").insert(data).catch(err => {
            return Utils.buildResponse({status: 'fail', data: Utils.getMysqlError(err)}, 400);
        });

        return Utils.buildResponse({data: body});
    }


    /**
     * Updates a user group
     *
     * @param userId {Number} - The user id
     * @param oldGroupId {Number} - The old group id the user belongs to
     * @param body {Object}- A payload containing the new group_id
     * @param who {Session}
     * @param API {API}
     * @returns {Promise<*>}
     */
    async updateUserGroup(userId, oldGroupId, body = {group_id: null}, who, API) {
        if (body.group_id === oldGroupId) return true;
        const db = this.context.db();
        const user_groups = {'group_id': body.group_id, updated_at: Utils.date.dateToMysql()};

        const user = (await db.table("users").where("id", userId).select(['wf_user_id'])).shift();

        if (!user) return false;

        await API.workflows().removeUserFromGroup(user.wf_user_id, oldGroupId);
        await API.workflows().addUserToGroup(user.wf_user_id, body.group_id);

        await db.table("user_groups").where('group_id', oldGroupId).where('user_id', userId).update(user_groups)
            .catch(console.error);

        return true;
    }


    /**
     * Updates a group
     *
     * @param value
     * @param body
     * @param who {Session}
     * @param API {API}
     */
    updateGroup(value, body = {}, who, API) {
        const Group = DomainFactory.build(DomainFactory.GROUP);
        const domain = new Group(body);
        const parent_group_id = (body['parent']) ? body['parent'] : null;
        const GroupMapper = MapperFactory.build(MapperFactory.GROUP);
        return GroupMapper.updateDomainRecord({value, domain}, who).then(() => {
            const db = this.context.db();
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

    /**
     * @param query
     * @param who {Session}
     * @returns {Promise<{data?: *, code?: *}>}
     */
    async getGroups(query = {}, who) {
        const {name, type, offset = 0, limit = 10} = query;
        const groups = await this.context.getKey("groups", true);
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
        const groups = await this.context.getKey("groups", true);
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
        const GroupMapper = MapperFactory.build(MapperFactory.GROUP);
        const roleDataTable = new GroupDataTable(this.context.database, GroupMapper, who);
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
        const db = this.context.db();

        Utils.random((r) => {
            db.raw(`update groups set name = CONCAT(name, ?) where ${by} = ?`, [`_${r}_deleted`, value]).then(() => {
                API.workflows().updateGroup(Object.assign({}, {id: value})).catch(console.error);
            }).catch(console.error);
        });

        return GroupMapper.deleteDomainRecord({by, value}, undefined, who).then(count => {
            if (!count) return Error.RecordNotFound();
            Events.emit("update_groups");
            return Utils.buildResponse({data: {by, message: "Group deleted"}});
        });
    }
}

module.exports = GroupService;