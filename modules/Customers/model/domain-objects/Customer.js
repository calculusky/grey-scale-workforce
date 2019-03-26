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
            account_no: "required|string",
            customer_name: "required|string",
            created_by: "integer|required",
            customer_type: "string|required",
            email: "email"
        };
    }


    async getTariff(db) {
        if (!this.account_no) {
            console.error("Cannot get tariff of without account_no set");
            return;
        }
        const [{tariff = null}] = await db.table("customers").select(['tariff']).where('account_no', this.account_no);
        return tariff;
    }

    async getReconnectionFee(db) {
        let tariff = this.tariff;
        if (!tariff) {
            tariff = await this.getTariff(db);
            this.tariff = tariff;
        }
        const {amount = 3000} = (await db.table("rc_fees").where('name', tariff).select(['amount'])).shift() || {};
        return amount;
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