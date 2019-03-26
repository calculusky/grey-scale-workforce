const DomainFactory = require('../../../DomainFactory');
let MapperFactory = null;
const ApiService = require('../../../ApiService');
const Utils = require('../../../../core/Utility/Utils');
const Error = require('../../../../core/Utility/ErrorUtils')();


/**
 * @name ActivityService
 * Created by paulex on 8/08/18.
 */
class ActivityService extends ApiService {

    constructor(context) {
        super(context);
        MapperFactory = this.context.modelMappers;
    }

    /**
     *
     * @param body
     * @param who
     * @param API {API}
     * @returns {Promise<*>}
     */
    async createActivity(body, who, API) {
        const Activity = DomainFactory.build(DomainFactory.ACTIVITY);
        const activity = new Activity(body);

        activity.serializeAssignedTo();

        ApiService.insertPermissionRights(activity, who);

        if (!activity.validate()) return Promise.reject(Error.ValidationFailure(activity.getErrors().all()));

        if (!(await API.groups().isGroupIdValid(activity.group_id))) return Promise.reject(Error.GroupNotFound);

        const ActivityMapper = MapperFactory.build(MapperFactory.ACTIVITY);

        const record = await ActivityMapper.createDomainRecord(activity, who).catch(err => (Promise.reject(err)));

        Utils.convertDataKeyToJson(record, "assigned_to");

        return Utils.buildResponse({data: record});
    }

    /**
     *
     * @param query
     * @param who
     * @param API {API}
     * @returns {Promise<{data?: *, code?: *}>}
     */
    async getActivities(query, who = {}, API) {
        const db = this.context.db();

        const {module, relation_id, activity_by, offset = 0, limit = 10} = query;

        const resultSet = db.table("activities").select(["*"]);

        if (module) resultSet.where('module', module);
        if (relation_id) resultSet.where("relation_id", relation_id);
        if (activity_by) resultSet.where("activity_by", activity_by);

        const activities = await resultSet.limit(Number(limit)).offset(Number(offset)).orderBy("id", "asc");

        const items = Utils.auditDifference(activities)
            .filter(item => !['id', 'updated_at'].includes(item.field_name)).reverse();

        const cols = ['id', 'username', 'first_name', 'last_name'];
        for (const item of items) {
            item.by = (await db.table("users").where("id", item.by).select(cols)).shift();
        }

        return Utils.buildResponse({data: {items}});
    }

}

module.exports = ActivityService;