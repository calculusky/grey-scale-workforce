//noinspection JSUnresolvedFunction
const DomainObject = require('../../../../core/model/DomainObject');
//noinspection JSUnresolvedFunction
const map = require('./map.json');

/**
 * @author Paul Okeke
 * Created by paulex on 8/22/17.
 * @name PaymentPlan
 */
class PaymentPlan extends DomainObject {

    constructor(data) {
        super(data, map);
        /*PLEASE DON'T PUT instance fields here that are not mapped to DB*/
    }

    required() {
        return [
            'disc_order_id'
        ];
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
            "deleted",
            "deleted_at"
        ];
    }

    rules() {
        return {
            disc_order_id: 'numeric|required',
            period: 'string|required',
            amount: 'between:100,1000000|required',
            waive_percentage: 'numeric|required'
        };
    }

    disconnection() {
        return this.relations().belongsTo("DisconnectionBilling", "disc_order_id");
    }

    createdBy() {
        return this.relations().belongsTo("User", "created_by");
    }

    approvedBy() {
        return this.relations().belongsTo("User", "approved_by");
    }
}

//noinspection JSUnresolvedVariable
module.exports = PaymentPlan;