const EventEmitter = require('events').EventEmitter;
const Utils = require('../core/Utility/Utils');

const _ = require('lodash');

class AuditEvent extends EventEmitter {

    constructor() {
        super();
        this.on("fault_added", this.onAuditFault);
        this.on("fault_updated", this.onAuditFault);
        this.on("work_order_added", this.onAuditWorkOrder);
        this.on("work_order_updated", this.onAuditWorkOrder);
    }

    /**
     * Initializes the Web Event with necessary inputs
     *
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
     *
     * @param module
     * @param relationId
     * @param type
     * @param who
     * @param source
     * @param newRecord
     * @param oldRecord
     * @param service
     * @param modelType
     */
    generateActivity(module, relationId, type, who = {}, source, newRecord, oldRecord, service = null, modelType = null) {
        const activity = {
            module: module,
            relation_id: relationId,
            activity_type: type,
            model_type: modelType,
            activity_by: who.sub,
            service_name: service || module,
            group_id: `${(Array.isArray(who.group) && who.group.length) ? who.group.shift() : 1}`,
            source: source
        };

        //If it is new record there is no need checking for differences
        if (activity.activity_type === "update") {
            const [diff, changeSummary] = Utils.spotDifferenceInRecord(newRecord, oldRecord);
            if (!diff) return;
            return changeSummary.forEach(i => {
                activity.description = i;
                this.api.activities().createActivity(activity, who).catch(console.error);
            });
        } else if (activity.activity_type === "create")
            activity.description = `Created a new ${module.substring(0, module.length - 1)}`;
        else if (activity.activity_type === "delete") {

        }
        this.api.activities().createActivity(activity, who).catch(console.error);
    }


    /**
     * If the oldRecord is specified then we can assume that
     * the fault is newly created
     *
     * @param fault
     * @param who
     * @param oldRecord
     */
    async onAuditFault(fault = {}, who, oldRecord = null) {
        this.generateActivity(
            "faults",
            fault.id,
            `${(oldRecord) ? "update" : "create"}`,
            who,
            fault.source,
            fault,
            oldRecord,
            "faults",
            fault.related_to
        );
        return true;
    }

    onAuditWorkOrder(workOrder = {}, who, oldRecord) {
        this.generateActivity(
            "work_orders",
            workOrder.id || oldRecord.id,
            `${(oldRecord) ? "update" : "create"}`,
            who,
            workOrder.source,
            workOrder,
            oldRecord,
            "workOrders",
            oldRecord.type_id
        );
        return true;
    }
}

module.exports = new AuditEvent();