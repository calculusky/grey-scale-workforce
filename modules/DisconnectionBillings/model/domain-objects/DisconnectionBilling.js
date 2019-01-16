/**
 * Created by paulex on 9/19/17.
 */
const DomainObject = require('../../../../core/model/DomainObject');
//noinspection JSUnresolvedFunction
const map = require('./map.json');

class DisconnectionBilling extends DomainObject {
    constructor(data) {
        super(data, map);
        /*PLEASE DON'T PUT instance fields here that are not mapped to DB*/
    }

    required() {
        return [];
    }

    guard() {
        return [
            'api_instance_id',
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
            account_no:'string|required',
            current_bill:'numeric|required',
            arrears:'numeric|required'
        };
    }

    paymentPlan() {
        return this.relations().belongsTo("PaymentPlan", "id", "disc_order_id");
    }

    workOrders(cols = ['id', 'work_order_no', "related_to", "relation_id", "type_id", "status"]){
        return this.relations().morphMany('WorkOrder', 'related_to', "relation_id", {
            localDomain: "disconnection_billings", localKey: "id"
        }, cols);
    }
    
    customer(cols=['account_no', 'old_account_no', 'email','meter_no', 'customer_name', 'mobile_no', 'plain_address', 'customer_type']){
        return this.relations().belongsTo('Customer', 'account_no', 'account_no', cols);
    }


}

//noinspection JSUnresolvedVariable
module.exports = DisconnectionBilling;