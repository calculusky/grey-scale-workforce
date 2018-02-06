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
            "deleted",
            "deleted_at"
        ];
    }

    rules() {
        return {
            type_id: 'int',
            related_to: String,
            relation_id: String,
            'status?': 'numeric',
            summary: String,
            issue_date: Date
        }
    }
    
    relatedTo(){
        return this.relations().morphTo('related_to', 'relation_id');
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
    customer() {
        return this.relations().belongsTo("Customer", 'relation_id', 'account_no');
    }

    /**
     * 
     * @returns {*}
     */
    disconnection(){
        return this.relations().belongsTo("DisconnectionOrder", "id", "work_order_id");
    }

    /**
     * 
     */
    workOrder(){
        return this.relations().belongsTo("WorkOrder", "relation_id", "work_order_no");
    }

    /**
     * 
     * @returns {*}
     */
    payment(){
        return this.relations().belongsTo("Payment", "work_order_no", "system_id");
    }
}

module.exports = WorkOrder;