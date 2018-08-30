const DomainFactory = require('../../../DomainFactory');
let MapperFactory = null;
const Utils = require('../../../../core/Utility/Utils');

/**
 * @name CustomerService
 * Created by paulex on 09/4/17.
 */
class CustomerService {

    constructor(context) {
        this.context = context;
        MapperFactory = this.context.modelMappers;
    }


    async getCustomer(value, by = "account_no", who = {}, offset = 0, limit = 10) {
        const CustomerMapper = MapperFactory.build(MapperFactory.CUSTOMER);
        const results = await CustomerMapper.findDomainRecord({by, value}, offset, limit);
        const groups = await Utils.getFromPersistent(this.context, "groups", true);
        const customers = CustomerService.addBUAndUTAttributes(results.records, groups);
        for (const customer of customers) customer.assets = (await customer.asset()).records;
        return Utils.buildResponse({data: {items: customers}})
    }

    /**
     *
     * @param query
     * @param who
     * @returns {Promise<{data?: *, code?: *}>}
     */
    async getCustomers(query, who = {}) {
        const Customer = DomainFactory.build(DomainFactory.CUSTOMER);
        const {meter_no, type, tariff, status, offset = 0, limit = 10} = query;

        const groups = await Utils.getFromPersistent(this.context, "groups", true);

        const resultSets = this.context.database.select(['*']).from('customers');

        if (meter_no) resultSets.where("meter_no", meter_no);
        if (type) resultSets.where("customer_type", type);
        if (tariff) resultSets.where("tariff", tariff);
        if (status) resultSets.whereIn('status', status.split(","));

        resultSets.where('deleted_at', null).limit(Number(limit)).offset(Number(offset)).orderBy('account_no', 'asc');

        const results = await resultSets.catch(err => (Utils.buildResponse({status: "fail", data: err}, 500)));
        const assets = CustomerService.addBUAndUTAttributes(results, groups, Customer);

        return Utils.buildResponse({data: {items: assets}});
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
        return CustomerMapper.createDomainRecord(customer).then(customer => {
            if (!customer) return Promise.reject();
            return Utils.buildResponse({data: customer});
        });
    }

    /**
     * We are majorly searching for customers by account_no and meter_no
     * @param keyword
     * @param offset
     * @param limit
     * @returns {Promise.<*>}
     */
    async searchCustomers(keyword, offset = 0, limit = 10) {
        const Customer = DomainFactory.build(DomainFactory.CUSTOMER);
        let fields = [
            'first_name',
            'last_name',
            'status',
            'customer_type',
            'meter_no',
            'plain_address',
            'account_no',
            'old_account_no'
        ];
        let resultSets = this.context.database.select(fields).from('customers')
            .where('account_no', 'like', `%${keyword}%`)
            .where("deleted_at", null)
            .orWhere('meter_no', 'like', `%${keyword}%`)
            .limit(parseInt(limit)).offset(parseInt(offset)).orderBy('account_no', 'asc');

        const groups = await Utils.redisGet(this.context.persistence, "groups");

        const results = await resultSets.catch(err => (Utils.buildResponse({status: "fail", data: err}, 500)));

        const assets = CustomerService.addBUAndUTAttributes(results, groups, Customer);
        return Utils.buildResponse({data: {items: assets}});
    }

    /**
     *
     * @param by
     * @param value
     * @returns {*}
     */
    deleteCustomer(by = "id", value) {
        const CustomerMapper = MapperFactory.build(MapperFactory.CUSTOMER);
        return CustomerMapper.deleteDomainRecord({by, value}).then(count => {
            if (!count) {
                return Utils.buildResponse({status: "fail", data: {message: "The specified record doesn't exist"}});
            }
            return Utils.buildResponse({data: {by, message: "Customer deleted"}});
        });
    }

    /**
     * @param results
     * @param groups
     * @param Customer {Customer} - The customer domain object
     */
    static addBUAndUTAttributes(results, groups, Customer) {
        return results.map(item => {
            const customer = (!Customer || item instanceof Customer) ? item : new Customer(item);
            let customerName = customer['customer_name'];
            customer['customer_name'] = (customerName) ? customerName : `${customer.first_name} ${customer.last_name}`;

            const group = groups[item.group_id];
            const [bu, ut] = Utils.getBUAndUT(group, groups);
            customer.group = group;
            customer.business_unit = bu;
            customer.undertaking = ut.shift() || null;
            return customer;
        })
    }
}

module.exports = CustomerService;