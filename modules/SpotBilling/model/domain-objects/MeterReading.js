//noinspection JSUnresolvedFunction
const DomainObject = require('../../../../core/model/DomainObject');
//noinspection JSUnresolvedFunction
const map = require('./map.json');

/**
 * @author Paul Okeke
 * Created by paulex on 9/4/17.
 * @name MeterReading
 */
class MeterReading extends DomainObject {

    constructor(data) {
        super(data, map);
        /*PLEASE DON'T PUT instance fields here that are not mapped to DB*/
    }

    required() {
        return [
            'meter_no',
            'current_reading'
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
            meter_no: '*',
            current_reading: 'numeric',
            'current_bill?': 'numeric'
        };
    }
    
    customer(){
        return this.relations().belongsTo('Customer', 'meter_no', 'meter_no');
    }
}

//noinspection JSUnresolvedVariable
module.exports = MeterReading;