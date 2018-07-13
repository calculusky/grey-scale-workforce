/**
 * @author Paul Okeke
 * Created by paulex on 7/5/17.
 */
const Utils = require('../Utility/Utils');
const mapperStore = {};

/**
 * @author Paul Okeke
 * 5th-July-2017
 * @name MapperFactory
 */
class MapperFactory {

    constructor() {

    }

    static initialize(path, context = null) {

    }

    /**
     *
     * @param mapperName
     * @param context
     * @param path
     * @returns {UserMapper|AssetMapper|FaultCategoryMapper}
     */
    static build(mapperName = "", path = "", context = null) {
        console.log(mapperName);
        return Utils.loadMapper(mapperStore, path, mapperName, context);
    }
}

MapperFactory.USER = "User";
MapperFactory.WORK_ORDER = "WorkOrder";
MapperFactory.FAULT = "Fault";
MapperFactory.ASSET = "Asset";
MapperFactory.NOTE = "Note";
MapperFactory.ATTACHMENT = "Attachment";
MapperFactory.CUSTOMER = "Customer";
MapperFactory.METER_READING = "MeterReading";
MapperFactory.NOTIFICATION = "Notification";
MapperFactory.UPLOAD = "Upload";
MapperFactory.DISCONNECTION_ORDER = "DisconnectionOrder";
MapperFactory.PAYMENT = "Payment";
MapperFactory.PAYMENT_PLAN = "PaymentPlan";
MapperFactory.ACTIVATION = "Activation";
MapperFactory.GROUP = "Group";
MapperFactory.ROLE = "Role";
MapperFactory.MATERIAL = "Material";
MapperFactory.MATERIAL_LOCATION = "MaterialLocation";
MapperFactory.MATERIAL_REQUISITION = "MaterialRequisition";
MapperFactory.STOCK_MOVEMENT = "StockMovement";
MapperFactory.MATERIAL_UTILIZATION = "MaterialUtilization";
MapperFactory.FAULT_CATEGORY = "FaultCategory";


module.exports = MapperFactory;
