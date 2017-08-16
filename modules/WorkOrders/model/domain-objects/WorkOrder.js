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
            'staff_id',
            'manager_id',
            'arrangements',
            'reasons',
            'departure_city',
            'arrival_city',
            'departure_date',
            'return_date'
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
            staff_id: Number,
            manager_id: Number,
            reasons: String,
            departure_city: String,
            arrival_city: String,
            departure_date: Date,
            return_date: Date
        }
    }

}

module.exports = WorkOrder;