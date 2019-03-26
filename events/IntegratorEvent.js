const EventEmitter = require('events').EventEmitter;
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
        if (!fault.relation_id) throw new TypeError("relation_id is not set");

        const iFault = Object.assign({}, fault);
        const db = this.context.db();

        const [[asset], categories] = await Promise.all([
            db.table("assets").where("id", iFault.relation_id).select(["ext_code"]),
            this.context.getKey("fault:categories", true)
        ]);
        const category = categories[iFault['category_id']];

        iFault.category = (category) ? category.name : null;
        iFault['fault_type'] = (category) ? category.type : null;

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
        return await Utils.requestPromise(options, "POST", headers).catch(console.error);
    }

    /**
     * TODO
     *
     * @param uFault
     * @param who
     * @returns {Promise<Boolean>}
     */
    async onFaultUpdated(uFault, who) {
        if (!uFault.id) throw new TypeError("The fault.id is not set.");
        const db = this.context.db();
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

        if (!fault.length) return false;

        const Fault = DomainFactory.build(DomainFactory.FAULT);
        const iFault = Object.assign({}, new Fault(fault.shift()));
        const categories = await this.context.getKey("fault:categories", true);
        const category = categories[iFault['category_id']];
        iFault.category = (category) ? category.name : null;
        iFault['fault_type'] = (category) ? category.type : null;

        //get the assets
        const record = await db.table("assets").where("id", iFault.relation_id).select(["ext_code"]);
        const asset = record.shift();

        if (!asset) return false;

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