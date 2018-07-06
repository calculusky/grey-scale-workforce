const EventEmitter = require('events').EventEmitter;
const _ = require('lodash');

class MessageEvent extends EventEmitter {

    constructor() {
        super();
        this.on("assign_work_order", this.assignWorkOrder);
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
     *
     *
     * @returns {Promise<void>}
     * @param workOrder
     * @param userIds
     * @param who
     */
    async assignWorkOrder(workOrder, userIds = [], who = {}) {
        userIds = (Array.isArray(userIds)) ? userIds : JSON.parse(userIds);
        userIds = userIds.map(i => i.id);

        if(!userIds.length) return;

        const body = {
            type: "work_orders",
            title: `Work Order ${workOrder.work_order_no} has been assigned to you.`,
            message: workOrder.summary,
            level: workOrder.priority,
            from: who.sub,
            to: userIds
        };
        console.log(body);
        await this.api.notifications().sendNotification(body, who, this.api).catch(err=>{
            console.log('MessageEvent:', JSON.stringify(err));
        });
    }
}

module.exports = new MessageEvent();