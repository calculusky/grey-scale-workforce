const ApiService = require('../../../ApiService');
const DomainFactory = require('../../../DomainFactory');
let MapperFactory = null;
const Utils = require('../../../../core/Utility/Utils');
const validate = require('validate-fields')();

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
     * Create Group
     *
     * @param body
     * @param who
     * @param API {API}
     */
    createGroup(body = {}, who = {}, API) {
        const Group = DomainFactory.build(DomainFactory.GROUP);
        let group = new Group(body);

        let isValid = validate(group.rules(), group);

        if (!isValid) return Promise.reject(Utils.buildResponse({status: "fail", msg: validate.lastError}, 400));

        ApiService.insertPermissionRights(group, who);

        //Get Mapper
        const GroupMapper = MapperFactory.build(MapperFactory.GROUP);

        return GroupMapper.createDomainRecord(group).then(group => {
            if (!group) return Promise.reject();

            //lets check if the parent of the group is specified
            let backgroundTask = [API.workflows().createGroup(group)];

            if (body['parent']) backgroundTask.push(this.linkGroup({parent_id: body['parent'], child_id: group.id}));

            Promise.all(backgroundTask).then().catch(err => console.log(err));

            return Utils.buildResponse({data: group});
        });
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

        let date = new Date();
        multi = multi.map(item => {
            if (item.parent_group_id === item.child_group_id) errors.push("parent_id and child_id cannot be the same");
            if (validate({'parent_id': 'int', 'child_id': 'int'}, item))
                return {
                    'parent_group_id': item['parent_id'],
                    'child_group_id': item['child_id'],
                    created_at: Utils.date.dateToMysql(date, 'YYYY-MM-DD H:m:s'),
                    updated_at: Utils.date.dateToMysql(date, 'YYYY-MM-DD H:m:s'),
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
     *
     * @param value
     * @param body
     * @param who
     * @param API {API}
     */
    updateGroup(value, body = {}, who = {}, API) {
        const Group = DomainFactory.build(DomainFactory.GROUP);
        const domain = new Group(body);

        const GroupMapper = MapperFactory.build(MapperFactory.GROUP);
        return GroupMapper.updateDomainRecord({value, domain}).then(() => {
            domain.id = value;
            const backgroundTask = [API.workflows().updateGroup(Object.assign({}, domain))];
            if (body['parent']) {
                let update = this.context.database.table("group_subs")
                    .where('child_group_id', value).update({'parent_group_id': body['parent']});
                backgroundTask.push(update);
            }
            Promise.all(backgroundTask).then().catch(err => console.log(err));
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