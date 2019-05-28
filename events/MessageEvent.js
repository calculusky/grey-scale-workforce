const EventEmitter = require('events').EventEmitter;
const _ = require('lodash');
const Utils = require('../core/Utility/Utils');

class MessageEvent extends EventEmitter {

    constructor() {
        super();
        this.on("assign_work_order", this.onWorkOrderAssigned);
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
     * @param workOrder {Object}
     * @param userIds {Object[]} An array of user object
     * @param userIds[].id {String|Number} The user id
     * @param who {Session}
     * @returns {Promise<Boolean>}
     */
    async onWorkOrderAssigned(workOrder, userIds = [], who) {
        userIds = (Array.isArray(userIds)) ? userIds : JSON.parse(userIds);
        userIds = userIds.map(i => i.id).filter(i => i);
        if (!userIds.length) return false;

        const group = await this.api.groups().isGroupIdValid(workOrder.group_id);
        const businessUnit = Utils.getGroupParent(group);
        const message = `BU: ${(businessUnit) ? businessUnit.name : ""} \nStatus : ${Utils.getWorkStatuses(workOrder.type_id, workOrder.status)}`;

        const body = {
            type: "work_orders",
            title: `Work Order ${workOrder.work_order_no} has been assigned to you.`,
            message,
            level: workOrder.priority,
            from: who.getAuthUser().getUserId(),
            record_ids: `["${workOrder.id}"]`,
            to: userIds
        };
        console.log(body);
        await this.api.notifications().sendNotification(body, who, this.api).catch(err => {
            console.log('MessageEvent:', err);
        });
        return true;
    }
}

module.exports = new MessageEvent();