//noinspection JSUnresolvedFunction
const DomainObject = require('../../../../core/model/DomainObject');
//noinspection JSUnresolvedFunction
const map = require('./map.json');

/**
 * @author Paul Okeke
 * Created by paulex on 10/09/17.
 * @name Payment
 */
class Payment extends DomainObject {

    constructor(data) {
        super(data, map);
        /*PLEASE DON'T PUT instance fields here that are not mapped to DB*/
    }

    required() {
        return [
            'system',
            'system_id',
            'amount',
            'transaction_id',
            'payer',
            'channel',
            'payment_date'
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
            system: String,
            system_id: String,
            amount: 'number(100, 1000000)', //1 <= 0 <= 1000000
            transaction_id: String,
            payer: String,
            channel: String,
            payment_date: Date
        };
    }

}

//noinspection JSUnresolvedVariable
module.exports = Payment;