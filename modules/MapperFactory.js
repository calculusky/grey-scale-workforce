/**
 * @author Paul Okeke
 * Created by paulex on 7/5/17.
 */
const Utils = require('../core/Utility/MapperUtil');
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
     * @returns {UserMapper|AssetMapper}
     */
    static build(mapperName = "", context = null) {
        switch (mapperName) {
            case MapperFactory.USER:
                return Utils.loadMapper(mapperStore, "../../modules/Users/model/mappers/UserMapper", context);
            case MapperFactory.WORK_ORDER:
                return Utils.loadMapper(mapperStore, "../../modules/WorkOrders/model/mappers/WorkOrderMapper", context);
            case MapperFactory.FAULT:
                return Utils.loadMapper(mapperStore, "../../modules/Faults/model/mappers/FaultMapper", context);
            case MapperFactory.ASSET:
                return Utils.loadMapper(mapperStore, "../../modules/Assets/model/mappers/AssetMapper", context);
            case MapperFactory.NOTE:
                return Utils.loadMapper(mapperStore, "../../modules/Notes/model/mappers/NoteMapper", context);
            case MapperFactory.ATTACHMENT:
                return Utils.loadMapper(mapperStore, "../../modules/Attachments/model/mappers/AttachmentMapper", context);
            case MapperFactory.CUSTOMER:
                return Utils.loadMapper(mapperStore, "../../modules/Customers/model/mappers/CustomerMapper", context);
            case MapperFactory.METER_READING:
                return Utils.loadMapper(mapperStore, "../../modules/SpotBilling/model/mappers/MeterReadingMapper", context);
            case MapperFactory.NOTIFICATION:
                return Utils.loadMapper(mapperStore, "../../modules/Notifications/model/mappers/NotificationMapper", context);
            case MapperFactory.UPLOAD:
                return Utils.loadMapper(mapperStore, "../../modules/Uploads/model/mappers/UploadMapper", context);
            case MapperFactory.DISCONNECTION_ORDER:
                return Utils.loadMapper(mapperStore, "../../modules/DisconnectionOrders/model/mappers/DisconnectionOrderMapper", context);
            
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
MapperFactory.DISCONNECTION_ORDER = "DisconnectionOrder";


module.exports = MapperFactory;
