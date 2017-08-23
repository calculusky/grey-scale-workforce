const DomainFactory = require('../../../DomainFactory');
const MapperFactory = require('../../../MapperFactory');
const Password = require('../../../../core/Utility/Password');
const Util = require('../../../../core/Utility/MapperUtil');
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
            by = "api_instance_id";
        } else if (value) {
            const temp = value;
            value = {};
            value[by] = temp;
            value['api_instance_id'] = who.api;
            by = "*_and";
        }
        const FaultMapper = MapperFactory.build(MapperFactory.FAULT);
        var executor = (resolve, reject)=> {
            FaultMapper.findDomainRecord({by, value}, offset, limit)
                .then(result=> {
                    let faults = result.records;
                    let processed = 0;
                    let rowLen = faults.length;
                    faults.forEach(fault=> {
                        var promises = [fault.user(), fault.asset()];
                        Promise.all(promises).then(values=> {
                            let assignedUser = values[0].records.shift(), asset = values[1].records.shift();
                            fault['assigned_name'] = `${assignedUser.first_name} ${assignedUser.last_name}`;
                            fault['asset_name'] = asset.asset_name;
                            if (++processed == rowLen)
                                return resolve(Util.buildResponse({data: {items: result.records}}));
                        }).catch(err=> {
                            return reject(err);
                        });
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
     * @param files
     */
    createFault(body = {}, who = {}, files=[]) {
        const Fault = DomainFactory.build(DomainFactory.FAULT);
        body['api_instance_id'] = who.api;
        let fault = new Fault(body);

        //Get Mapper
        const FaultMapper = MapperFactory.build(MapperFactory.FAULT);
        return FaultMapper.createDomainRecord(fault).then(fault=> {
            if (!fault) return Promise.reject();
            if(fault.labels) fault.labels = JSON.parse(fault.labels);
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