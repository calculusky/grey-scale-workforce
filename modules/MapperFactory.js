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
     * @returns {UserMapper|AssetMapper}
     */
    static build(mapperName = "") {
        switch (mapperName) {
            case MapperFactory.USER:
                return Utils.loadMapper(mapperStore, "../../modules/Users/model/mappers/UserMapper");
            case MapperFactory.WORK_ORDER:
                return Utils.loadMapper(mapperStore, "../../modules/WorkOrders/model/mappers/WorkOrderMapper");
            case MapperFactory.FAULT:
                return Utils.loadMapper(mapperStore, "../../modules/Faults/model/mappers/FaultMapper");
            case MapperFactory.ASSET:
                return Utils.loadMapper(mapperStore, "../../modules/Assets/model/mappers/AssetMapper");
            case MapperFactory.NOTE:
                return Utils.loadMapper(mapperStore, "../../modules/Notes/model/mappers/NoteMapper");
            case MapperFactory.ATTACHMENT:
                return Utils.loadMapper(mapperStore, "../../modules/Attachments/model/mappers/AttachmentMapper");
        }
    }
}

MapperFactory.USER = "User";
MapperFactory.WORK_ORDER = "WorkOrder";
MapperFactory.FAULT = "Fault";
MapperFactory.ASSET = "Asset";
MapperFactory.NOTE = "Note";
MapperFactory.NOTE = "Note";
MapperFactory.ATTACHMENT = "Attachment";


module.exports = MapperFactory;
