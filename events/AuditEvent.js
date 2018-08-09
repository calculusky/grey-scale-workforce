const EventEmitter = require('events').EventEmitter;
const Utils = require('../core/Utility/Utils');

const _ = require('lodash');

class AuditEvent extends EventEmitter {

    constructor() {
        super();
        this.on("fault_added", this.onAuditFault);
        this.on("fault_updated", this.onAuditFault);
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
     * If the oldRecord is specified then we can assume that
     * the fault is newly created
     *
     * @param fault
     * @param who
     * @param oldRecord
     */
    async onAuditFault(fault = {}, who, oldRecord = null) {
        const activity = {
            module: "faults",
            relation_id: fault.id,
            activity_type: `${(oldRecord) ? "update" : "create"}`,
            activity_by: who.sub,
            group_id: `${(Array.isArray(who.group) && who.group.length) ? who.group.shift() : 1}`,
            source: fault.source
        };

        const [diff, changeSummary] = Utils.spotDifferenceInRecord(fault, oldRecord);

        if (!diff) return;

        activity.description = changeSummary;

        console.log(activity);

        //How do we check the columns that changed
        const response = await this.api.activities().createActivity(activity, who).catch(console.error);

        return true;
    }

    onAuditWorkOrder(fault = {}, who, oldRecord) {

    }
}

module.exports = new AuditEvent();