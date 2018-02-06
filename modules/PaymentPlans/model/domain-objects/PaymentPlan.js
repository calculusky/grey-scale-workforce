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
            'asset_name',
            'asset_type',
            'serial_no'
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
            asset_name: String
        };
    }


    user() {
        return this.relations().belongsTo("User", "assigned_to");
    }
}

//noinspection JSUnresolvedVariable
module.exports = PaymentPlan;