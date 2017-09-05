const DomainFactory = require('../../../DomainFactory');
const MapperFactory = require('../../../MapperFactory');
const Util = require('../../../../core/Utility/MapperUtil');
const validate = require('validate-fields')();

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
            //Its important that all queries are streamlined majorly for each business
            value = who.api;
            by = "api_instance_id";
        } else if (value) {
            const temp = value;
            value = {};
            value[by] = temp;
            value['api_instance_id'] = who.api;
            by = "*_and";
        }
        const MeterReadingMapper = MapperFactory.build(MapperFactory.METER_READING);
        var executor = (resolve, reject)=> {
            MeterReadingMapper.findDomainRecord({by, value}, offset, limit)
                .then(result=> {
                    let meterReadings = result.records;
                    let processed = 0;
                    let rowLen = meterReadings.length;
                    return resolve(Util.buildResponse({data: {items: result.records}}));
                    // meterReadings.forEach(meterReading=> {
                    //     meterReading.customer().then(res=> {
                    //         meterReading.customer = res.records.shift();
                    //         if (++processed == rowLen)
                    //             return resolve(Util.buildResponse({data: {items: result.records}}));
                    //     }).catch(err=> {
                    //         console.log(err);
                    //         return reject(err)
                    //     })
                    // });
                })
                .catch(err=> {
                    console.log(err);
                    return reject(err);
                });
        };
        return new Promise(executor)
    }

    /**
     *
     * @param body
     * @param who
     * @param files
     * @param API
     */
    createMeterReading(body = {}, who = {}, files = [], API) {
        const MeterReading = DomainFactory.build(DomainFactory.METER_READING);
        body['api_instance_id'] = who.api;
        let meterReading = new MeterReading(body);
        
        let isValid = validate(meterReading.rules(), meterReading);
        if (!isValid) {
            return Promise.reject(Util.buildResponse({status: "fail", data: {message: validate.lastError}}, 400));
        }

        //If there are files along with this request lets get it ready for upload
        let attachments = [];
        if (files.length) files.forEach(file=>attachments.push({
            module: 'meter_readings',
            file_name: file.filename,
            file_size: file.size,
            file_path: file.path,
            file_type: file.mimetype
        }));

        //Get Mapper
        const MeterReadingMapper = MapperFactory.build(MapperFactory.METER_READING);
        return MeterReadingMapper.createDomainRecord(meterReading).then(meterReading=> {
            if (!meterReading) return Promise.reject();
            attachments.forEach(attachment => {
                attachment['relation_id'] = meterReading.id;
                API.attachments().createAttachment(attachment)
            });
            return Util.buildResponse({data: meterReading});
        }).catch(err=>{
            //TODO remove the attachments already added if this fails
            return Promise.reject(err);
        });
    }

    /**
     *
     * @param by
     * @param value
     * @returns {*}
     */
    deleteMeterReading(by = "id", value) {
        const MeterReadingMapper = MapperFactory.build(MapperFactory.METER_READING);
        return MeterReadingMapper.deleteDomainRecord({by, value}).then(count=> {
            if (!count) {
                return Util.buildResponse({status: "fail", data: {message: "The specified record doesn't exist"}});
            }
            return Util.buildResponse({data: {by, message: "MeterReading deleted"}});
        });
    }
}

module.exports = MeterReadingService;