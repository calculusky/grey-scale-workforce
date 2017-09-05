const DomainFactory = require('../../../DomainFactory');
const MapperFactory = require('../../../MapperFactory');
const Util = require('../../../../core/Utility/MapperUtil');
/**
 * @name CustomerService
 * Created by paulex on 09/4/17.
 */
class CustomerService {

    constructor() {

    }

    getName() {
        return "customerService";
    }

    getCustomers(value, by = "id", who = {api: -1}, offset = 0, limit = 10) {
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
        const CustomerMapper = MapperFactory.build(MapperFactory.CUSTOMER);
        var executor = (resolve, reject)=> {
            CustomerMapper.findDomainRecord({by, value}, offset, limit)
                .then(result=> {
                    let customers = result.records;
                    let processed = 0;
                    let rowLen = customers.length;

                    customers.forEach(customer=> {
                        customer.user().then(res=> {
                            customer.user = res.records.shift();
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
    createCustomer(body = {}, who = {}) {
        const Customer = DomainFactory.build(DomainFactory.CUSTOMER);
        body['api_instance_id'] = who.api;
        let customer = new Customer(body);


        //Get Mapper
        const CustomerMapper = MapperFactory.build(MapperFactory.CUSTOMER);
        return CustomerMapper.createDomainRecord(customer).then(customer=> {
            if (!customer) return Promise.reject();
            return Util.buildResponse({data: customer});
        });
    }

    /**
     *
     * @param by
     * @param value
     * @returns {*}
     */
    deleteCustomer(by = "id", value) {
        const CustomerMapper = MapperFactory.build(MapperFactory.CUSTOMER);
        return CustomerMapper.deleteDomainRecord({by, value}).then(count=> {
            if (!count) {
                return Util.buildResponse({status: "fail", data: {message: "The specified record doesn't exist"}});
            }
            return Util.buildResponse({data: {by, message: "Customer deleted"}});
        });
    }
}

module.exports = CustomerService;