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
            "deleted_at"
        ];
    }

    rules() {
        return {
            system: 'string|required',
            system_id: 'string|required',
            amount: 'between:100,1000000|required', //1 <= 0 <= 1000000
            transaction_id: 'string|required',
            payer: 'string|required',
            channel: 'string|required',
            payment_date: 'date'
        };
    }

    setPaymentAmount(amount = this.amount) {
        let amt = amount;
        if (!isNaN(amount)) amt = parseFloat(amount);
        this.amount = amt;
    }

    setPaymentDate(date) {
        if (date) this.payment_date = date;
    }

    setSystemId(systemId = this.system_id) {
        if (systemId) this.system_id = systemId.replace(/-/g, "").toUpperCase();
    }

    setGroupId(groupId) {
        this.group_id = groupId;
    }

    setAssignedTo(assignedTo = this.assigned_to) {
        if (assignedTo) {
            this.assigned_to = JSON.stringify(assignedTo);
        }
    }

}

//noinspection JSUnresolvedVariable
module.exports = Payment;