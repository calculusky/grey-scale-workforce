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
                case DomainFactory.CUSTOMER:
                    return require('./Customers/model/domain-objects/Customer');
                case DomainFactory.METER_READING:
                    return require('./SpotBilling/model/domain-objects/MeterReading');
                case DomainFactory.NOTIFICATION:
                    return require('./Notifications/model/domain-objects/Notification');
                case DomainFactory.UPLOAD:
                    return require('./Uploads/model/domain-objects/Upload');
                case DomainFactory.DISCONNECTION_ORDER:
                    return require('./DisconnectionOrders/model/domain-objects/DisconnectionOrder');
                case DomainFactory.PAYMENT:
                    return require('./Payments/model/domain-objects/Payment');
                case DomainFactory.PAYMENT_PLAN:
                    return require('./PaymentPlans/model/domain-objects/PaymentPlan');
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
DomainFactory.CUSTOMER = "Customer";
DomainFactory.METER_READING = "MeterReading";
DomainFactory.NOTIFICATION = "Notification";
DomainFactory.UPLOAD = "Upload";
DomainFactory.DISCONNECTION_ORDER = "DisconnectionOrder";
DomainFactory.PAYMENT = "Payment";
DomainFactory.PAYMENT_PLAN = "PaymentPlan";

module.exports = DomainFactory;