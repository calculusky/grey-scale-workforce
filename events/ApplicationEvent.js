const EventEmitter = require('events').EventEmitter;
const DomainFactory = require('../modules/DomainFactory');
const Utils = require('../core/Utility/Utils');
const {isEqual} = require('lodash');

class ApplicationEvent extends EventEmitter {

    constructor() {
        super();
        this.on("update_groups", this.onUpdateGroups);
        this.on("work_order_updated", this.onWorkOrderUpdate);
        this.on("fault_added", this.onFaultAdded);
        this.on("fault_updated", this.onFaultUpdated);
        this.on("role_updated", this.onRoleUpdated);
    }


    /**
     * Initializes the Application Event with necessary inputs
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
     * Reloads the group when a new group is added or updated
     *
     * @param group
     * @returns {Promise<void>}
     */
    async onUpdateGroups(group = {}) {
        this.context.loadStaticData().then();
    }

    /**
     * This event is triggered when an update is done
     * on a work order.
     *
     *
     *
     * @param workOrder - Either this or the {@param oldRecord} should have the
     *                    work order id, type_id and {@link onWorkOrderUpdate#relation_id}
     * @param who
     * @param oldRecord
     * @returns {Promise<Boolean>}
     */
    async onWorkOrderUpdate(workOrder = {}, who, oldRecord) {
        if (!workOrder.status) return false;

        const workId = workOrder.id || oldRecord.id;
        const typeId = workOrder.type_id || oldRecord.type_id;
        const relationId = workOrder.relation_id || oldRecord.relation_id;

        if (!workId || !typeId || !relationId) {
            console.error(
                "onWorkOrderUpdate:",
                "Either the workOrder or oldRecord must have an id, type_id and relation_id parameter set."
            );
            return false;
        }

        const oldStatus = Utils.getWorkStatuses(workOrder.type_id || oldRecord.type_id, oldRecord.status);
        const status = Utils.getWorkStatuses(workOrder.type_id || oldRecord.type_id, workOrder.status);

        const closedStatuses = ['disconnected', 'closed', 'canceled'];

        if (!status || (typeof oldStatus === "string" && closedStatuses.includes(oldStatus.toLowerCase()))) return false;

        const workflowEndRegex = /(close|disconnect|cancel)/gi;

        if (status.toLowerCase().match(workflowEndRegex)) {
            const compDate = {completed_date: Utils.date.dateToMysql()};
            const res = await this.api.workOrders().updateWorkOrder("id", workId, compDate, who, [], this.api).catch(
                err => console.error("onWorkOrderUpdate:", err)
            );

            console.warn('onWorkOrderUpdate:success', res);
            if (!res) return false;

            /*
            * For Work Orders that are related to fault; we are going to check
            * if all the work orders related to that fault is closed
            * if all work orders is closed then it is ideal to close the fault itself
            * */
            if (Number(typeId) === 3) {
                const Fault = DomainFactory.build(DomainFactory.FAULT);
                const fault = new Fault({id: relationId});
                const workOrders = (await fault.workOrders()).records;
                const statuses = Utils.getWorkStatuses(typeId);

                const sumClosed = workOrders.reduce((acc, wo) => {
                    return acc + (statuses[wo.status]['name'].includes("Closed") ? 1 : 0)
                }, 0);

                const sumCanceled = workOrders.reduce((acc, wo) => {
                    return acc + (statuses[wo.status]['name'].includes("Canceled") ? 1 : 0)
                }, 0);

                if (sumClosed === workOrders.length) {
                    const update = {status: 4, completed_date: Utils.date.dateToMysql()};
                    this.api.faults().updateFault("id", fault.id, update, who, [], this.api).catch(err => {
                        console.error("onWorkOrderUpdate:Fault:", err);
                    });
                }
                else if (sumCanceled === workOrders.length) {
                    //TODO setting the status id manually can pose problems
                    const update = {status: 8, completed_date: Utils.date.dateToMysql()};
                    this.api.faults().updateFault("id", fault.id, update, who, [], this.api).catch(err => {
                        console.error("onWorkOrderUpdateCancel:Fault:", err);
                    });
                    console.log("Canceled Faults");
                }
            }
            return true;
        }
        return false;
    }

    /**
     *
     * @param fault
     * @param who
     * @returns {Promise<Boolean>}
     */
    async onFaultAdded(fault = {}, who) {
        if (fault.related_to && fault.related_to.toLowerCase() !== "assets") return false;
        const asset = (await fault.asset()).records.shift();
        //check if the asset status is already in-active before setting it to in-active
        if (asset && `${asset.status}` === "0") return false;
        const res = await this.api.assets().updateAsset(asset.id, {status: "0"}, who).catch(console.error);
        //TODO update all sub-assets
        return res && res.data.status === "success";
    }

    /**
     * This event is triggered when a fault is updated
     *
     * @param fault
     * @param who
     * @param oldRecord
     * @returns {Promise<boolean>}
     */
    async onFaultUpdated(fault, who, oldRecord) {
        if (!fault.status) return false;

        const faultId = fault.id || oldRecord.id;
        const relatedTo = fault.related_to || oldRecord.related_to;
        fault.relation_id = fault.relation_id || oldRecord.relation_id;

        const oldStatus = Utils.getFaultStatus(`${oldRecord.status}`);
        const status = Utils.getFaultStatus(`${fault.status}`);

        /*
        * If the fault is newly closed we should update the asset status
        * to active
        * */
        if (!status || (typeof oldStatus === "string" && oldStatus.toLowerCase().includes("closed"))) return false;

        if (status.toLowerCase().includes("closed")) {
            const compDate = {completed_date: Utils.date.dateToMysql()};

            const res = await this.api.faults().updateFault("id", faultId, compDate, who, [], this.api).catch(
                err => console.error("onFaultUpdated:", err)
            );

            if (!res) return false;

            if (relatedTo && relatedTo.toLowerCase() !== "assets") return false;

            const asset = (await fault.asset()).records.shift();

            //check if the asset status is already in-active before setting it to in-active
            if (`${asset.status}` === "1") return false;

            await this.api.assets().updateAsset(asset.id, {status: "1"}, who).catch(console.error);
            //TODO update all sub-assets
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