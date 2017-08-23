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
        try{
            switch (domainName) {
                case DomainFactory.USER:
                    return require('./Users/model/domain-objects/User');
                case DomainFactory.TRAVEL_REQUEST:
                    return require('./TravelRequests/model/domain-objects/TravelRequest');
                case DomainFactory.WORK_ORDER:
                    return require('./WorkOrders/model/domain-objects/WorkOrder');
                case DomainFactory.FAULT:
                    return require('./Faults/model/domain-objects/Fault');
                case DomainFactory.ASSET:
                    return require('./Assets/model/domain-objects/Asset');
                case DomainFactory.NOTE:
                    return require('./Notes/model/domain-objects/Note');
                case DomainFactory.ATTACHMENT:
                    return require('./Attachments/model/domain-objects/Attachment');
            }
        }catch (e){
            if(e.code=="MODULE_NOT_FOUND"){
                return null;
            }
        }
    }
}

//An Assumed Static Fields for this class
DomainFactory.USER = "User";
DomainFactory.TRAVEL_REQUEST = "TravelRequest";
DomainFactory.WORK_ORDER = "WorkOrder";
DomainFactory.FAULT = "Fault";
DomainFactory.ASSET = "Asset";
DomainFactory.NOTE = "Note";
DomainFactory.ATTACHMENT = "Attachment";

module.exports = DomainFactory;