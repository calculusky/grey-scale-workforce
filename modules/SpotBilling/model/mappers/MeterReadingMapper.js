/**
 * Created by paulex on 8/22/17.
 */


const ModelMapper = require('../../../../core/model/ModelMapper');


class MeterReadingMapper extends ModelMapper{
    constructor(context) {
        super(context);
        this.primaryKey = "id";
        this.tableName = "meter_readings";
        this.domainName = "MeterReading";
    }
}

module.exports = MeterReadingMapper;