const DomainFactory = require('../../../DomainFactory');
const MapperFactory = require('../../../MapperFactory');
const Password = require('../../../../core/Utility/Password');
const Util = require('../../../../core/Utility/MapperUtil');
const Utils = require('../../../../core/Utility/Utils');
const validate = require('validate-fields')();

/**
 * @author Paul Okeke
 * @name FaultService
 * Created by paulex on 7/4/17.
 */
class FaultService {
    /**
     *
     * @param api API
     */
    constructor(api) {
        this.api = api;
    }

    getName() {
        return "faultService";
    }

    /**
     *
     * @param value
     * @param by
     * @param who
     * @param offset
     * @param limit
     * @returns {Promise}
     */
    getFaults(value, by = "id", who = {api: -1}, offset = 0, limit = 10) {
        if (!value || "" + value + "".trim() == '') {
            //Its important that all queries are streamlined to majorly for each business
            value = who.api;
        } else if (value) {
            console.log(value)
        }
        const FaultMapper = MapperFactory.build(MapperFactory.FAULT);
        var executor = (resolve, reject)=> {
            FaultMapper.findDomainRecord({by, value}, offset, limit).then(result=> {
                console.log(result);
                let faults = result.records;
                let processed = 0;
                let rowLen = faults.length;
                faults.forEach(fault=> {
                    let promises = [];

                    //A fault can either be related to a customer directly or an asset
                    let isAsset = fault['related_to'] == 'assets';
                    promises.push((isAsset) ? fault.asset() : fault.customer());

                    Promise.all(promises).then(values=> {
                        //its compulsory that we check that a record exist
                        let relatedModel = values.shift().records.shift();
                        if (relatedModel && isAsset) {
                            fault['relation_name'] = relatedModel.asset_name;
                        } else if (relatedModel) {
                            fault['relation_name'] = `${relatedModel.first_name} ${relatedModel.last_name}`;
                        }
                        if (++processed == rowLen)
                            return resolve(Util.buildResponse({data: {items: result.records}}));
                    }).catch(err=> {
                        return reject(err);
                    });
                });
                if (!rowLen) return resolve(Util.buildResponse({data: {items: result.records}}));
            }).catch(err=> {
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
    createFault(body = {}, who = {}, files = [], API) {
        const Fault = DomainFactory.build(DomainFactory.FAULT);
        body['api_instance_id'] = who.api;
        let fault = new Fault(body);
        //if the issue date isn't set we are going to set it ourselves
        if(!fault.issue_date) fault.issue_date = Utils.date.dateToMysql(new Date(), "YYYY-MM-DD H:m:s");
        
        let isValid = validate(fault.rules(), fault);
        if (!isValid) {
            return Promise.reject(Util.buildResponse({status: "fail", data: {message: validate.lastError}}, 400));
        }

        //If there are files along with this request lets get it ready for upload
        let attachments = [];
        if (files.length) files.forEach(file=>attachments.push({
            module: 'faults',
            file_name: file.filename,
            file_size: file.size,
            file_path: file.path,
            file_type: file.mimetype
        }));

        //Get Mapper
        const FaultMapper = MapperFactory.build(MapperFactory.FAULT);
        return FaultMapper.createDomainRecord(fault).then(fault=> {
            if (!fault) return Promise.reject();
            attachments.forEach(attachment =>{ attachment['relation_id'] = fault.id; API.attachments().createAttachment(attachment)});
            if (fault.labels) fault.labels = JSON.parse(fault.labels);
            return Util.buildResponse({data: fault});
        }).catch(err=>{
            return Promise.reject(err);
        });
    }

    /**
     *
     * @param by
     * @param value
     * @returns {*}
     */
    deleteFault(by = "id", value) {
        const FaultMapper = MapperFactory.build(MapperFactory.FAULT);
        return FaultMapper.deleteDomainRecord({by, value}).then(count=> {
            if (!count) {
                return Util.buildResponse({status: "fail", data: {message: "The specified record doesn't exist"}});
            }
            return Util.buildResponse({data: {by, message: "Fault deleted"}});
        });
    }
}

module.exports = FaultService;