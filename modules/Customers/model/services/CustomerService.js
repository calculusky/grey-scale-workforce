const DomainFactory = require('../../../DomainFactory');
let MapperFactory = null;
const Util = require('../../../../core/Utility/MapperUtil');
/**
 * @name CustomerService
 * Created by paulex on 09/4/17.
 */
class CustomerService {

    constructor(context) {
        this.context = context;
        MapperFactory = this.context.modelMappers;
    }

    getName() {
        return "customerService";
    }

    getCustomers(value, by = "account_no", who = {api: -1}, offset = 0, limit = 10) {
        const CustomerMapper = MapperFactory.build(MapperFactory.CUSTOMER);
        var executor = (resolve, reject)=> {
            CustomerMapper.findDomainRecord({by, value}, offset, limit)
                .then(result=> {
                    let customers = result.records;
                    let processed = 0;
                    let rowLen = customers.length;
                    return resolve(Util.buildResponse({data: {items: customers}}));
                    // customers.forEach(customer=> {
                    //     customer.user().then(res=> {
                    //         customer.user = res.records.shift();
                    //         if (++processed == rowLen)
                    //             return resolve(Util.buildResponse({data: {items: result.records}}));
                    //     }).catch(err=> {
                    //         return reject(err)
                    //     })
                    // })
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
     * We are majorly searching for customers by account_no and meter_no
     * @param keyword
     * @param offset
     * @param limit
     * @returns {Promise.<Customer>}
     */
    searchCustomers(keyword, offset = 0, limit = 10) {
        const Customer = DomainFactory.build(DomainFactory.CUSTOMER);
        let fields = ['first_name', 'last_name', 'status', 'customer_type', 'meter_no', 'plain_address',
            'account_no', 'old_account_no'];
        let resultSets = this.context.database.select(fields).from('customers')
            .where('account_no', 'like', `%${keyword}%`).orWhere('meter_no', 'like', `%${keyword}%`);
        resultSets = resultSets.limit(parseInt(limit)).offset(parseInt(offset)).orderBy('account_no', 'asc');
        return resultSets.then(results=> {
            let customers = [];
            results.forEach(customer=> {
                customer['customer_name'] = (customer['customer_name'])
                    ? customer['customer_name']
                    : `${customer.first_name} ${customer.last_name}`;
                customers.push(new Customer(customer))
            });
            return Util.buildResponse({data: {items: customers}});
        }).catch(err=> {
            return Util.buildResponse({status: "fail", data: err}, 500);
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