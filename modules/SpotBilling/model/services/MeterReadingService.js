const DomainFactory = require('../../../DomainFactory');
const MapperFactory = require('../../../MapperFactory');
const Util = require('../../../../core/Utility/MapperUtil');
/**
 * @name MeterReadingService
 * Created by paulex on 09/4/17.
 */
class MeterReadingService {

    constructor() {

    }

    getName() {
        return "meterReadingService";
    }

    getMeterReadings(value, by = "id", who = {api: -1}, offset = 0, limit = 10) {
        if (!value || "" + value + "".trim() == '') {
            //Its important that all queries are streamlined to majorly for each business
            value = who.api;
            by = "api_instance_id";
        } else if (value) {
            const temp = value;
            value = {};
            value[by] = temp;
            value['api_instance_id'] = who.api;
            by = "*_and";
        }
        const MeterReadingMapper = MapperFactory.build(MapperFactory.CUSTOMER);
        var executor = (resolve, reject)=> {
            MeterReadingMapper.findDomainRecord({by, value}, offset, limit)
                .then(result=> {
                    let meterReadings = result.records;
                    let processed = 0;
                    let rowLen = meterReadings.length;

                    meterReadings.forEach(meterReading=> {
                        meterReading.user().then(res=> {
                            meterReading.user = res.records.shift();
                            if (++processed == rowLen)
                                return resolve(Util.buildResponse({data: {items: result.records}}));
                        }).catch(err=> {
                            return reject(err)
                        })
                    })
                })
                .catch(err=> {
                    return reject(err);
                });
        };
        return new Promise(executor)
    }

    /**
     *
     * @param body
     * @param who
     */
    createMeterReading(body = {}, who = {}) {
        const MeterReading = DomainFactory.build(DomainFactory.CUSTOMER);
        body['api_instance_id'] = who.api;
        let meterReading = new MeterReading(body);


        //Get Mapper
        const MeterReadingMapper = MapperFactory.build(MapperFactory.CUSTOMER);
        return MeterReadingMapper.createDomainRecord(meterReading).then(meterReading=> {
            if (!meterReading) return Promise.reject();
            return Util.buildResponse({data: meterReading});
        });
    }

    /**
     *
     * @param by
     * @param value
     * @returns {*}
     */
    deleteMeterReading(by = "id", value) {
        const MeterReadingMapper = MapperFactory.build(MapperFactory.CUSTOMER);
        return MeterReadingMapper.deleteDomainRecord({by, value}).then(count=> {
            if (!count) {
                return Util.buildResponse({status: "fail", data: {message: "The specified record doesn't exist"}});
            }
            return Util.buildResponse({data: {by, message: "MeterReading deleted"}});
        });
    }
}

module.exports = MeterReadingService;