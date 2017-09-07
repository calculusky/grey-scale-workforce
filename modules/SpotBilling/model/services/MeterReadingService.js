const DomainFactory = require('../../../DomainFactory');
const MapperFactory = require('../../../MapperFactory');
const Util = require('../../../../core/Utility/MapperUtil');
const validate = require('validate-fields')();
const Utils = require('../../../../core/Utility/Utils');

/**
 * @name MeterReadingService
 * Created by paulex on 09/4/17.
 */
class MeterReadingService {

    constructor(context) {
        this.context = context;
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
        console.log(body);
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
        }).catch(err=> {
            console.log(err);
            //TODO remove the attachments already added if this fails
            return Promise.reject(err);
        });
    }

    /**
     *
     * @param body
     * @param who
     * @param files
     * @param API
     */
    generateBill(body = {}, who = {}, files = [], API) {
        //check that the user has supplied the current_reading and the meter no
        if (!body['meter_no'] || !body['current_reading'])
            return Promise.reject(Util.buildResponse({
                status: "fail",
                data: {message: 'Specify the meter_no and the current_reading'}
            }, 400));
        const meterNo = body['meter_no'];
        const currentReading = body['current_reading'];
        const tariff = 45.3;//TODO get this tariff from config file
        //Next lets pick up the last meter reading
        //thus: (PAR - LAR) * tariff

        let fields = [
            'tariff',
            'current_reading',
            'previous_reading',
            'current_opening_bal',
            'current_closing_bal',
            'current_payment',
            'vat_charge',
            'current_bill'
        ];
        let resultSets = this.context.database.select(fields).from('meter_readings')
            .where('meter_no', meterNo).orderBy('id', 'desc').limit(1);
        const MeterReading = DomainFactory.build(DomainFactory.METER_READING);


        return resultSets.then(results=> {
            if (!results.length) {
                //Just in-case there was no previous reading
                results.push({
                    current_reading: 0.0, previous_reading: 0.0,
                    current_opening_bal: 0.0, current_closing_bal: 0.0,
                    current_payment: 0.0, vat_charge: 0.0, current_bill: 0.0
                });
            }
            //check that the current meter reading is greater than or equals to the previous
            let previousMeterReading = new MeterReading(results.shift());

            if (previousMeterReading['current_reading'] > currentReading) {
                return; //tell the caller that something is wrong.
            }
            //else lets calculate the current bill
            const billAmount = (currentReading - previousMeterReading['current_reading']) * tariff;
            const energy = currentReading - previousMeterReading['current_reading'];

            //Calculations for the new closing balance
            const todayOpeningBal = previousMeterReading['current_closing_bal'];
            const currentPayment = previousMeterReading['current_payment'];
            const closingBal = (todayOpeningBal - currentPayment) + billAmount;

            let newMeterReading = {
                'meter_no': meterNo,
                'previous_reading': previousMeterReading['current_reading'],
                'current_reading': currentReading,
                'current_opening_bal': todayOpeningBal,
                'current_closing_bal': closingBal,
                'current_bill': billAmount,
                'energy': energy,
                'tariff': previousMeterReading['tariff'],
                'vat_charge': (previousMeterReading['vat_charge'] / previousMeterReading['current_bill']) * billAmount,
                'read_date': Utils.date().dateToMysql(new Date())
            };

            return this.createMeterReading(newMeterReading, who, files, API);
        });
    }

    /**
     *
     * @param meterNo
     * @param who
     * @returns {Promise.<MeterReading>}
     */
    getLastMeterReading(meterNo, who = {}) {
        let fields = [
            'tariff',
            'current_reading',
            'previous_reading',
            'current_opening_bal',
            'current_closing_bal',
            'current_payment',
            'current_closing_bal',
            'vat_charge',
            'current_bill'
        ];
        let resultSets = this.context.database.select(fields).from('meter_readings')
            .where('meter_no', meterNo).orderBy('id', 'desc').limit(1);
        const MeterReading = DomainFactory.build(DomainFactory.METER_READING);

        return resultSets.then(results=> {
            console.log(results);
            if (!results.length) {
                console.log("nothing");
                //Just in-case there was no previous reading
                results.push({
                    current_reading: 0.0, previous_reading: 0.0,
                    current_opening_bal: 0.0, current_closing_bal: 0.0,
                    current_payment: 0.0, vat_charge: 0.0, current_bill: 0.0
                });
            }
            console.log(results);
            let previousMeterReading = new MeterReading(results.shift());
            return Promise.resolve(Util.buildResponse({data: previousMeterReading}));
        }).catch(err=> {
            console.log(err);
            return Promise.reject(err)
        })
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