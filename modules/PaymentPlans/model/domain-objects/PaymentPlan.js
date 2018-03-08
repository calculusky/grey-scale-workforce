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
            disc_order_id: 'numeric',
            period: String,
            amount: 'numeric(100, 90000000)',
            waive_percentage: 'numeric'
        };
    }

    disconnection() {
        return this.relations().belongsTo("DisconnectionOrder", "disc_order_id");
    }
}

//noinspection JSUnresolvedVariable
module.exports = PaymentPlan;