/**
 * @author Paul Okeke
 * Created by paulex on 7/5/17.
 */
// const User = require('./Users/model/domain-objects/User');
// const TravelRequest = require('./TravelRequests/model/domain-objects/TravelRequest');

class DomainFactory {

    constructor() {

    }

    /**
     * A factory method that builds Domain Objects.
     *
     * @param domainName
     * @param options
     */
    static build(domainName = "", ...options) {
        switch (domainName) {
            case DomainFactory.USER:
                return require('./Users/model/domain-objects/User');
            case DomainFactory.TRAVEL_REQUEST:
                return require('./TravelRequests/model/domain-objects/TravelRequest');
            case DomainFactory.STAFF:
                return require('./Staffs/model/domain-objects/Staff');
        }
    }

}

//An Assumed Static Fields for this class
DomainFactory.USER = "User";
DomainFactory.TRAVEL_REQUEST = "TravelRequest";
DomainFactory.STAFF = "Staff";

module.exports = DomainFactory;