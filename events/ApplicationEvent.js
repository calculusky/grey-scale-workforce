const EventEmitter = require('events').EventEmitter;
const _ = require('lodash');
const Utils = require('../core/Utility/Utils');
const {isEqual} = require('lodash');

class ApplicationEvent extends EventEmitter {

    constructor() {
        super();
        this.on("update_groups", this.onUpdateGroups);
        this.on("work_order_updated", this.onWorkOrderUpdate);
        this.on("role_updated", this.onRoleUpdated)
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
            //Broadcast to the UI that a work order has been closed
            await this.api.workOrders()
                .updateWorkOrder("id", workOrder.id || oldRecord.id, completedDate, who, [], this.api);
        }
    }

    /**
     *
     *
     * @param {Role} role
     * @param who
     * @param {Role} oldRecord
     * @returns {Promise<Boolean>}
     */
    async onRoleUpdated(role, who, oldRecord) {

        //For now We are only concerned if the permissions changed
        if (!role.permissions || !oldRecord.permissions) return false;

        if (isEqual(role.permissions, oldRecord.permissions)) return false;

        const userIds = (await role.users()).records.map(({id}) => id);

        userIds.forEach(userId => {
            const socketIds = this.sharedData.clients[userId];
            if (!socketIds || socketIds.length < 1) return;
            socketIds.forEach(socketId => {
                const socket = this.io.sockets.connected[socketId];
                if (socket) socket.emit('role_updated', true);
            });
        });
        return true;
    }

}

module.exports = new ApplicationEvent();