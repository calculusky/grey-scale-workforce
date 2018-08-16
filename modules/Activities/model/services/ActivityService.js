const DomainFactory = require('../../../DomainFactory');
let MapperFactory = null;
const ApiService = require('../../../ApiService');
const Utils = require('../../../../core/Utility/Utils');
const crypto = require('crypto');
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

        Utils.convertDataKeyToJson(record, "labels", "assigned_to");

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
        const Activity = DomainFactory.build(DomainFactory.ACTIVITY);
        // const ActivityMapper = MapperFactory.build(MapperFactory.ACTIVITY);

        const {module, relation_id, activity_by, offset = 0, limit = 10} = query;

        const resultSet = db.table("activities").select(["*"]);

        if (module) resultSet.where('module', module);
        if (relation_id) resultSet.where("relation_id", relation_id);
        if (activity_by) resultSet.where("activity", activity_by);

        const activities = await resultSet.where('deleted_at', null).limit(Number(limit)).offset(Number(offset)).orderBy("id", "desc");

        let i = 0;
        for (let activity of activities) {
            activity = new Activity(activity);

            if (activity.activity_type === "update") {
                const fieldName = activity.description.substring(0, activity.description.indexOf(":"));
                const values = activity.description.substring(activity.description.indexOf(":") + 1, activity.description.length);
                const [oldValue, newValue] = await API[activity.service_name]().attributesToValues(fieldName, values.split("__::::__"));
                activity.description = `${fieldName} from ${oldValue} to ${newValue}`;
            }

            let {records} = await activity.activityBy("username", "first_name", "last_name");
            activity.activity_by = records.shift();
            activities[i] = activity;
            i++;
        }
        console.log(activities);
        return Utils.buildResponse({data: {items: activities}});
    }
}

module.exports = ActivityService;