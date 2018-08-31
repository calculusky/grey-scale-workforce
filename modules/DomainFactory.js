/**
 * @author Paul Okeke
 * Created by paulex on 7/5/17.
 */

//TODO this class is a factory class for object, would be nice if we can automate it
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
        try {
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
                    return require('./DisconnectionBillings/model/domain-objects/DisconnectionBilling');
                case DomainFactory.PAYMENT:
                    return require('./Payments/model/domain-objects/Payment');
                case DomainFactory.PAYMENT_PLAN:
                    return require('./PaymentPlans/model/domain-objects/PaymentPlan');
                case DomainFactory.ACTIVATION:
                    return require('./Activations/model/domain-objects/Activation');
                case DomainFactory.GROUP:
                    return require('./Groups/model/domain-objects/Group');
                case DomainFactory.ROLE:
                    return require('./Roles/model/domain-objects/Role');
                case DomainFactory.MATERIAL:
                    return require('./Materials/model/domain-objects/Material');
                case DomainFactory.MATERIAL_REQUISITION:
                    return require('./MaterialRequisitions/model/domain-objects/MaterialRequisition');
                case DomainFactory.MATERIAL_LOCATION:
                    return require('./MaterialLocations/model/domain-objects/MaterialLocation');
                case DomainFactory.STOCK_MOVEMENT:
                    return require('./StockMovements/model/domain-objects/StockMovement');
                case DomainFactory.MATERIAL_UTILIZATION:
                    return require('./MaterialUtilizations/model/domain-objects/MaterialUtilization');
                case DomainFactory.ACTIVITY:
                    return require('./Activities/model/domain-objects/Activity');
                case DomainFactory.PENDING_REASON:
                    return require('./BaseRecords/model/domain-objects/PendingReason');
                case DomainFactory.FAULT_CATEGORY:
                    return require('./FaultCategories/model/domain-objects/FaultCategory');
            }
        } catch (e) {
            if (e.code === "MODULE_NOT_FOUND") {
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
DomainFactory.DISCONNECTION_ORDER = "DisconnectionBilling";
DomainFactory.PAYMENT = "Payment";
DomainFactory.PAYMENT_PLAN = "PaymentPlan";
DomainFactory.ACTIVATION = "Activation";
DomainFactory.GROUP = "Group";
DomainFactory.ROLE = "Role";
DomainFactory.MATERIAL = "Material";
DomainFactory.MATERIAL_REQUISITION = "MaterialRequisition";
DomainFactory.MATERIAL_LOCATION = "MaterialLocation";
DomainFactory.STOCK_MOVEMENT = "StockMovement";
DomainFactory.MATERIAL_UTILIZATION = "MaterialUtilization";
DomainFactory.FAULT_CATEGORY = "FaultCategory";
DomainFactory.ACTIVITY = "Activity";
DomainFactory.PENDING_REASON = "PendingReason";

module.exports = DomainFactory;