const DomainFactory = require('../../../DomainFactory');
let MapperFactory = null;
const ApiService = require('../../../ApiService');
const Utils = require('../../../../core/Utility/Utils');
const validate = require('validatorjs');
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
     * @returns {Promise<*>}
     */
    async createActivity(body, who) {
        const Activity = DomainFactory.build(DomainFactory.ACTIVITY);
        const activity = new Activity(body);

        activity.assigned_to = Utils.serializeAssignedTo(activity.assigned_to);

        ApiService.insertPermissionRights(activity, who);

        const validator = new validate(activity, activity.rules(), activity.customErrorMessages());

        if (validator.fails()) return Promise.reject(Error.ValidationFailure(validator.errors.all()));

        const groups = await Utils.getFromPersistent(this.context, "groups", true).catch(_ => (Promise.reject(Error.InternalServerError)));

        const group = groups[activity.group_id];

        if (!group) return Promise.reject(Error.GroupNotFound);

        const ActivityMapper = MapperFactory.build(MapperFactory.ACTIVITY);

        const record = await ActivityMapper.createDomainRecord(activity).catch(err => (Promise.reject(err)));

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
        const db = this.context.database;

        const {module, relation_id, activity_by, offset = 0, limit = 10} = query;

        const resultSet = db.table("activities").select(["*"]);

        if (module) resultSet.where('module', module);
        if (relation_id) resultSet.where("relation_id", relation_id);
        if (activity_by) resultSet.where("activity", activity_by);

        const activities = await resultSet.limit(Number(limit)).offset(Number(offset)).orderBy("id", "asc");

        const items = Utils.auditDifference(activities).filter(item => !['id', 'updated_at'].includes(item.field_name));
        console.log(items);
        return Utils.buildResponse({data: {items}});
    }
}

module.exports = ActivityService;