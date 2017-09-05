const DomainFactory = require('../../../DomainFactory');
const MapperFactory = require('../../../MapperFactory');
const Password = require('../../../../core/Utility/Password');
const Util = require('../../../../core/Utility/MapperUtil');
const validate = require('validate-fields')();

/**
 * @author Paul Okeke
 * @name FaultService
 * Created by paulex on 7/4/17.
 */
class FaultService {

    constructor() {

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
                            fault['asset_name'] = relatedModel.asset_name;
                        } else if (relatedModel) {
                            fault['customer_name'] = `${relatedModel.first_name} ${relatedModel.last_name}`;
                            fault['account_no'] = relatedModel.account_no;
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
     * @param value
     * @param status
     * @param offset
     * @param limit
     */
    getFaultsAssignedTo(value, status = "?", offset = 0, limit = 10) {
        
    }

    /**
     *
     * @param body
     * @param who
     * @param files
     */
    createFault(body = {}, who = {}, files = []) {
        const Fault = DomainFactory.build(DomainFactory.FAULT);
        body['api_instance_id'] = who.api;
        let fault = new Fault(body);

        let isValid = validate(fault.rules(), fault);
        if (!isValid) {
            return Promise.reject(Util.buildResponse({status: "fail", data: {message: validate.lastError}}, 400));
        }

        //Get Mapper
        const FaultMapper = MapperFactory.build(MapperFactory.FAULT);
        return FaultMapper.createDomainRecord(fault).then(fault=> {
            if (!fault) return Promise.reject();
            if (fault.labels) fault.labels = JSON.parse(fault.labels);
            return Util.buildResponse({data: fault});
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