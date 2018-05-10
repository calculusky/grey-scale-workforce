const EventEmitter = require('events').EventEmitter;
const _ = require('lodash');

class ApplicationEvent extends EventEmitter {

    constructor() {
        super();
        this.on("update_groups", this.onUpdateGroups);
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
}

module.exports = new ApplicationEvent();