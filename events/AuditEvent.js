const EventEmitter = require('events').EventEmitter;
const Utils = require('../core/Utility/Utils');

const _ = require('lodash');

class AuditEvent extends EventEmitter {

    constructor() {
        super();
        this.on("audit", this.onAudit);
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

    onAudit(command, module, relationId, record, who, domainName) {
        const activity = {
            module: module,
            relation_id: relationId,
            activity_type: command,
            record: JSON.stringify(record),
            description: "...",
            model_type: domainName,
            activity_by: who.sub,
            group_id: (Array.isArray(who.group) && who.group.length) ? `${who.group[0]}` : '1'
        };
        this.api.activities().createActivity(activity, who).catch(console.error);
    }

}

module.exports = new AuditEvent();