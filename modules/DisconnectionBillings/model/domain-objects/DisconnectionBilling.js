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
        return {};
    }

    paymentPlan() {
        return this.relations().belongsTo("PaymentPlan", "id", "disc_order_id");
    }

    workOrders(){
        return this.relations().morphMany('WorkOrder', 'related_to', "relation_id", {
            localDomain: "disconnections", localKey: "id"
        });
    }
    
    customer(cols=['account_no', 'old_account_no', 'email','meter_no', 'customer_name', 'mobile_no', 'plain_address', 'customer_type']){
        return this.relations().belongsTo('Customer', 'account_no', 'account_no', cols);
    }


}

//noinspection JSUnresolvedVariable
module.exports = DisconnectionBilling;