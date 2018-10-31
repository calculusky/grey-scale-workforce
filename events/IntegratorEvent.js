const EventEmitter = require('events').EventEmitter;
const _ = require('lodash');
const Utils = require("../core/Utility/Utils");
const DomainFactory = require("../modules/DomainFactory");

class IntegratorEvent extends EventEmitter {

    constructor() {
        super();
        this.on("fault_added", this.onFaultAdded);
        this.on("fault_updated", this.onFaultUpdated);
    }

    /**
     * Initializes the Event with necessary inputs
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
     * TODO create a table for service-subscribers
     *
     * Such that when an event is triggered we can look-up
     * all the subscribers to this service and notify them all
     *
     * @param fault
     * @param who
     */
    async onFaultAdded(fault = {}, who) {
        if (fault.source === "crm") return false;

        const iFault = Object.assign({}, fault);
        const db = this.context.database;

        const categories = await Utils.getFromPersistent(this.context, "fault:categories", true);
        iFault.category = categories[iFault['category_id']].name;
        iFault['fault_type'] = categories[iFault['category_id']].type;

        //get the assets
        const record = await db.table("assets").where("id", iFault.relation_id).select(["ext_code"]);
        const asset = record.shift();

        if (!asset) return;

        iFault['ext_code'] = asset['ext_code'];

        delete iFault['category_id'];
        delete iFault['related_to'];
        delete iFault['relation_id'];

        const url = process.env.CRM_URL + "/index.php?entryPoint=fault-create";

        const headers = {'Content-type': "application/x-www-form-urlencoded"};
        const options = {
            url,
            headers,
            form: iFault,
            timeout: 1500
        };
        return await Utils.requestPromise(options, "POST", headers);
    }

    /**
     * TODO
     *
     * @param uFault
     * @param who
     * @returns {Promise<void>}
     */
    async onFaultUpdated(uFault, who) {
        const db = this.context.database;
        const fCols = [
            "id",
            "related_to",
            "relation_id",
            "labels",
            "priority",
            "status",
            "fault_category_id as category_id",
            "summary",
            "resolution"
        ];

        const fault = await db.table("faults").where("id", uFault.id).select(fCols);

        if (!fault.length) return;

        const Fault = DomainFactory.build(DomainFactory.FAULT);
        const iFault = Object.assign({}, new Fault(fault.shift()));
        const categories = await Utils.getFromPersistent(this.context, "fault:categories", true);
        iFault.category = categories[iFault['category_id']].name;
        iFault['fault_type'] = categories[iFault['category_id']].type;

        //get the assets
        const record = await db.table("assets").where("id", iFault.relation_id).select(["ext_code"]);
        const asset = record.shift();

        if (!asset) return;

        iFault['ext_code'] = asset['ext_code'];

        delete iFault['category_id'];
        delete iFault['related_to'];
        delete iFault['relation_id'];

        const url = process.env.CRM_URL + "/index.php?entryPoint=fault-update";

        const headers = {'Content-type': "application/x-www-form-urlencoded"};
        const options = {
            url,
            headers,
            form: iFault,
            timeout: 1500
        };
        return await Utils.requestPromise(options, "POST", headers);
    }

}

module.exports = new IntegratorEvent();