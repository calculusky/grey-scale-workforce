const DomainFactory = require('../../../DomainFactory');
let MapperFactory = null;
const ApiService = require('../../../ApiService');
const Utils = require('../../../../core/Utility/Utils');
const Error = require('../../../../core/Utility/ErrorUtils')();


/**
 * @name LocationHistoryService
 * Created by paulex on 11/2/18.
 */
class LocationHistoryService extends ApiService {

    constructor(context) {
        super(context);
        MapperFactory = this.context.modelMappers;
    }

    /**
     * @param body {Object}
     * @param who {Session}
     * @returns {Promise<*>}
     */
    async createLocationHistory(body, who) {
        const LocationHistory = DomainFactory.build(DomainFactory.LOCATION_HISTORY);
        const locationHistory = new LocationHistory(body);

        if(!locationHistory.validate()) return Promise.reject(Error.ValidationFailure(locationHistory.getErrors().all()));

        const location = locationHistory.location;

        locationHistory.location = this.context.db().raw(`POINT(${location.x}, ${location.y})`);

        const LocationHistoryMapper = MapperFactory.build(MapperFactory.LOCATION_HISTORY);
        return LocationHistoryMapper.createDomainRecord(locationHistory, who).then(history => {
            history.location = location;
            return Utils.buildResponse({data: history});
        });
    }

    /**
     *
     * @param query {Object}
     * @param who {Session}
     * @param API {API}
     * @returns {Promise<{data?: *, code?: *}>}
     */
    async getLocationHistory(query, who, API) {
        const {group_id, user_id} = query;
        let users = [];
        if (group_id) users = await API.groups().getGroupUsers(group_id);
        else if (user_id) ({data: {data: {items: users}}} = (await API.users().getUsers(user_id)));
        for (let user of users) ({records: user.locations} = (await user.locationHistory()));
        return Utils.buildResponse({data: {items: users}});
    }
}

module.exports = LocationHistoryService;