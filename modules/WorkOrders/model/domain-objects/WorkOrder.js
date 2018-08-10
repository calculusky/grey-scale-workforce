//noinspection JSUnresolvedFunction
const DomainObject = require('../../../../core/model/DomainObject');
//noinspection JSUnresolvedFunction
const map = require('./map.json');

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
            false,
            "deleted_at"
        ];
    }

    rules() {
        return {
            type_id: 'integer|required|in:1,2,3',
            related_to: 'string|required|in:faults,disconnection_billings',
            relation_id: 'string|required',
            status: 'numeric|required',
            summary: 'string|required',
            issue_date: 'date|required',
            labels: 'string-array',
            assigned_to: 'string-array'
        }
    }

    relatedTo(related_to = "", cols = []) {
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