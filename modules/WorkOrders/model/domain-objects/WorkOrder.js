//noinspection JSUnresolvedFunction
const DomainObject = require('../../../../core/model/DomainObject');
//noinspection JSUnresolvedFunction
const map = require('./map.json');
const {getGroupParent, date: moment, getWorkPriorities, getWorkOrderType, getWorkStatuses} = require('../../../../core/Utility/Utils');

/**
 * Created by paulex on 7/5/17.
 */

class WorkOrder extends DomainObject {

    constructor(data) {
        super(data, map);
    }

    required() {
        return [
            'type_id',
            'related_to',
            'relation_id',
            'summary',
            'issue_date'
        ];
    }

    guard() {
        return [
            'id'
        ];
    }

    softDeletes() {
        return [
            true,
            "deleted_at",
            "deleted_by"
        ];
    }

    rules() {
        return {
            type_id: 'integer|required|in:1,2,3',
            related_to: 'string|required|in:faults,disconnection_billings',
            relation_id: 'string|required',
            status: 'numeric|required',
            status_comment: 'string',
            summary: 'string|required',
            issue_date: 'date',
            start_date: 'date',
            end_date: 'date|after:start_date',
            actual_start_date: 'date',
            labels: 'string-array',
            assigned_to: 'string-array',
            metadata:'string-object'
        }
    }

    setType(typeId) {
        this.type_id = typeId;
    }

    setRelationId(relationId) {
        this.relation_id = relationId;
    }

    setIssueDate(date = this.issue_date) {
        if (!date) this.issue_date = moment.dateToMysql();
        else this.issue_date = moment.dateFormat(date);
        return this;
    }

    setRelatedTo(relatedTo) {
        this.related_to = relatedTo;
    }

    getNotesCount(db) {
        if (!this.id) return console.assert(this.id, "Work Order ID is not set");
        return db.count('note as notes_count')
            .from("notes").where("module", "work_orders").where("relation_id", this.id);
    }

    getAttachmentsCount(db) {
        if (!this.id) return console.assert(this.id, "Work Order ID is not set");
        return db.count('id as attachments_count')
            .from("notes").where("module", "work_orders").where("relation_id", this.id);
    }

    getMaterialsUtilizedCount(db) {
        if (!this.id) return console.assert(this.id, "Work Order ID is not set");
        return db.count("id as mat_count").from("material_utilizations").where("work_order_id", this.id);
    }

    getRelatedRecordCount(db) {
        return [
            this.getNotesCount(db),
            this.getAttachmentsCount(db),
            this.getMaterialsUtilizedCount(db)
        ];
    }

    /**
     * Converts {@property this.work_order_no} to a human readable format
     *
     * @returns {string|*}
     */
    humanizeWorkOrderNo() {
        if (!this.work_order_no) return;
        let formattedNo = "";
        let stringItems = this.work_order_no.split("");
        for (let i = 0; i < stringItems.length; i++) {
            formattedNo += stringItems[i];
            if (i === 3 || i === 9 || i === 12) {
                formattedNo += "-";
            }
        }
        this.work_order_no = formattedNo;
        return this.work_order_no;
    }

    /**
     *
     * @param workType {String}
     * @param relatedModel {DisconnectionBilling|Fault}
     * @returns {Promise<void>}
     */
    async setRelatedModelData(workType, relatedModel) {
        this[workType.toLowerCase()] = relatedModel;
        const relatedTo = this.related_to.toLowerCase();
        switch (relatedTo) {
            case "disconnection_billings":
                const [customer, plan] = await Promise.all([relatedModel.customer(), relatedModel.paymentPlan()]);
                this['customer'] = customer.records.shift() || {};
                this['payment_plans'] = plan.records;
                break;
            case "faults":
                if (relatedModel.related_to.toLowerCase() === "assets") {
                    const asset = await relatedModel.asset();
                    this['faults']['asset'] = asset.records.shift() || {};
                } else if (relatedModel.related_to.toLowerCase() === "customers") {
                    const cus = await relatedModel.customer();
                    this['faults']['customer'] = cus.records.shift() || {};
                }
                break;
        }
    }

    /**
     * Generates a new work order number and assigns it to the attribute "work_order_no"
     *
     * Rejects with a -2 value if the group cannot be found
     *
     * @param ctx {Context}
     * @param group
     * @returns {Promise<*>}
     */
    async generateWorkOrderNo(ctx, group = {}) {
        const Utils = require('../../../../core/Utility/Utils');
        const bu = getGroupParent(group, 'business_unit') || group;
        const prefix = WorkOrder.getWorkOrderPrefix(this.type_id);
        const shortName = bu['short_name'] || (bu.name.substring(0, 2) + bu.name.charAt(3)).toUpperCase();
        const uniqueNo = await Utils.generateUniqueSystemNumber(prefix, shortName, 'work_orders', ctx);
        this.work_order_no = uniqueNo.toUpperCase();

        return this.work_order_no;
    }

    static getWorkOrderPrefix(typeId) {
        if (!typeId) return "W";
        switch (parseInt(typeId)) {
            case 1:
                return "D";
            case 2:
                return "R";
            case 3:
                return "F";
        }
        return "W";
    }

    /**
     *
     * @param context
     * @return {{}|*}
     */
    toAuditAbleFormat(context) {
        const newData = {...this};
        const typeId = newData['type_id'] || 1;
        for (const [key, value] of Object.entries(newData)) {
            switch (key) {
                case 'status': {
                    newData[key] = getWorkStatuses(typeId, value);
                    newData['status_value'] = value;
                    break;
                }
                case 'type_id': {
                    newData[key] = getWorkOrderType(typeId).name;
                    newData['type_id_value'] = value;
                    break;
                }
                case 'group_id': {
                    context.getKey("groups", true).then(groups=>{
                        newData[key] = groups[value].name;
                    });
                    newData['group_id_value'] = value;
                    break;
                }
                case 'priority': {
                    newData[key] = getWorkPriorities(1, value);
                    newData['priority_value'] = value;
                    break;
                }
                case 'labels': {
                    newData[key] = JSON.parse(value);
                    break;
                }
                case 'assigned_to': {
                    newData[key] = JSON.parse(value);
                    break;
                }
                default:
                    break;
            }
        }
        return newData;
    }


    /* --------------------------------------------/
     | Work Order Relationships
     *--------------------------------------------*/
    relatedTo(related_to = this.related_to, cols = []) {
        switch (related_to) {
            case "faults": {
                if (cols.length) break;
                cols.push('id', 'related_to', 'relation_id', 'fault_category_id', 'labels', 'priority', 'status', 'summary', 'issue_date');
                break;
            }
            default:
                cols.push('*')
        }
        return this.relations().morphTo('related_to', 'relation_id', cols);
    }

    /**
     * Returns the associated Asset for this Work Order
     * @returns {Promise}
     */
    asset() {
        return this.relations().belongsTo("Asset", 'relation_id');
    }


    /**
     * Returns the customer this Work Order was created for
     * @returns {*}
     */
    customer(cols = ['account_no', 'old_account_no', 'email', 'meter_no', 'customer_name', 'mobile_no', 'plain_address', 'customer_type']) {
        return this.relations().belongsTo("Customer", 'relation_id', 'account_no', cols);
    }

    /**
     *
     * @returns {*}
     */
    disconnection() {
        return this.relations().belongsTo("DisconnectionOrder", "id", "work_order_id");
    }

    /**
     * Returns the notes for this work order
     * @returns {Promise}
     */
    notes() {
        return this.relations().morphMany("Note", 'module', 'relation_id');
    }

    /**
     *
     * @returns {*}
     */
    payment() {
        return this.relations().belongsTo("Payment", "work_order_no", "system_id");
    }

    createdBy(cols = ["id", "username", "first_name", "last_name"]) {
        return this.relations().belongsTo("User", "created_by", cols);
    }
}

module.exports = WorkOrder;