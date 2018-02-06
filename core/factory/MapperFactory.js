/**
 * @author Paul Okeke
 * Created by paulex on 7/5/17.
 */
const Utils = require('../Utility/MapperUtil');
const mapperStore = {};

/**
 * @author Paul Okeke
 * 5th-July-2017
 * @name MapperFactory
 */
class MapperFactory {

    constructor() {

    }

    /**
     *
     * @param mapperName
     * @param context
     * @param path
     * @returns {UserMapper|AssetMapper}
     */
    static build(mapperName = "", path = "", context = null) {
        switch (mapperName) {
            case MapperFactory.USER:
                return Utils.loadMapper(mapperStore, path, mapperName, context);
            case MapperFactory.WORK_ORDER:
                return Utils.loadMapper(mapperStore, path, mapperName, context);
            case MapperFactory.FAULT:
                return Utils.loadMapper(mapperStore, path, mapperName, context);
            case MapperFactory.ASSET:
                return Utils.loadMapper(mapperStore, path, mapperName, context);
            case MapperFactory.NOTE:
                return Utils.loadMapper(mapperStore, path, mapperName, context);
            case MapperFactory.ATTACHMENT:
                return Utils.loadMapper(mapperStore, path, mapperName, context);
            case MapperFactory.CUSTOMER:
                return Utils.loadMapper(mapperStore, path, mapperName, context);
            case MapperFactory.METER_READING:
                return Utils.loadMapper(mapperStore, path, mapperName, context);
            case MapperFactory.NOTIFICATION:
                return Utils.loadMapper(mapperStore, path, mapperName, context);
            case MapperFactory.UPLOAD:
                return Utils.loadMapper(mapperStore, path, mapperName, context);
            case MapperFactory.DISCONNECTION_ORDER:
                return Utils.loadMapper(mapperStore, path, mapperName, context);
            case MapperFactory.PAYMENT:
                return Utils.loadMapper(mapperStore, path, mapperName, context);
            case MapperFactory.PAYMENT_PLAN:
                return Utils.loadMapper(mapperStore, path, mapperName, context);
        }
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
MapperFactory.DISCONNECTION_ORDER = "DisconnectionBilling";
MapperFactory.PAYMENT = "Payment";
MapperFactory.PAYMENT_PLAN = "PaymentPlan";


module.exports = MapperFactory;
