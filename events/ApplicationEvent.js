const EventEmitter = require('events').EventEmitter;
const _ = require('lodash');
const Utils = require('../core/Utility/Utils');

class ApplicationEvent extends EventEmitter {

    constructor() {
        super();
        this.on("update_groups", this.onUpdateGroups);
        this.on("work_order_updated", this.onWorkOrderUpdate)
    }


    /**
     * Initializes the Web Event with necessary inputs
     * @param context {Context}
     * @param io
     * @param API {API}
     * @param sharedData
     */
    init(context, io, API, sharedData) {
        this.context = context;
        this.io = io;
        this.api = API;
        this.sharedData = sharedData;
        return this;
    }

    /**
     * Reloads the group when a new group is added or updated
     *
     * @param group
     * @returns {Promise<void>}
     */
    async onUpdateGroups(group = {}) {
        this.context.loadStaticData().then();
    }

    /**
     *
     * @param workOrder
     * @param who
     * @param oldRecord
     * @returns {Promise<void>}
     */
    async onWorkOrderUpdate(workOrder = {}, who, oldRecord) {
        if (!workOrder.status) return;

        const oldStatus = Utils.getWorkStatuses(workOrder.type_id || oldRecord.type_id, oldRecord.status);
        const status = Utils.getWorkStatuses(workOrder.type_id || oldRecord.type_id, workOrder.status);

        if (!status || oldStatus.toLowerCase().includes("closed")) return;

        if (status.toLowerCase().includes("closed")) {
            const completedDate = {
                completed_date: Utils.date.dateToMysql()
            };
            await this.api.workOrders()
                .updateWorkOrder("id", workOrder.id || oldRecord.id, completedDate, who, [], this.api);
        }
    }

}

module.exports = new ApplicationEvent();