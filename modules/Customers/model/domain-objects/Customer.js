//noinspection JSUnresolvedFunction
const DomainObject = require('../../../../core/model/DomainObject');
//noinspection JSUnresolvedFunction
const map = require('./map.json');

/**
 * @author Paul Okeke
 * Created by paulex on 9/4/17.
 * @name Customer
 */
class Customer extends DomainObject {

    constructor(data) {
        super(data, map);
        /*PLEASE DON'T PUT instance fields here that are not mapped to DB*/
    }

    required() {
        return [
            'account_no'
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
            true,
            "deleted_at"
        ];
    }

    rules() {
        return {
            account_no: String
        };
    }


    disconnectionBilling(cols = ["id", "account_no", "work_order_id", "current_bill"]) {
        return this.relations().hasMany(
            "DisconnectionBilling",
            "account_no",
            "account_no",
            cols
        )
    }

    asset(cols = ["assets.id", "assets.asset_name", "assets.asset_type"]) {
        return this.relations().belongsToMany(
            "Asset",
            "customers_assets",
            "customer_id",
            "asset_id",
            "account_no",
            null,
            cols
        )
    }

}

//noinspection JSUnresolvedVariable
module.exports = Customer;