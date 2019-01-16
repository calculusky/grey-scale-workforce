const DomainFactory = require('../../../DomainFactory');
let MapperFactory = null;
const Utils = require('../../../../core/Utility/Utils');
const {orderBy} = require("lodash");
const CustomerDataTable = require('../commons/CustomerDataTable');


/**
 * @name CustomerService
 * Created by paulex on 09/4/17.
 */
class CustomerService {

    constructor(context) {
        this.context = context;
        MapperFactory = this.context.modelMappers;
    }


    async getCustomer(value, by = "account_no", who = {}, offset = 0, limit = 10, includes = ['assets']) {
        const CustomerMapper = MapperFactory.build(MapperFactory.CUSTOMER);
        const results = await CustomerMapper.findDomainRecord({by, value}, offset, limit);
        const groups = await Utils.getFromPersistent(this.context, "groups", true);
        const customers = CustomerService.addBUAndUTAttributes(results.records, groups);
        if (includes.includes("assets"))
            for (const customer of customers) customer.assets = (await customer.asset()).records;
        return Utils.buildResponse({data: {items: customers}});
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
     * Fetches work-orders that has a level of relationship with a customer
     *
     * Most work-orders are primarily not related to a customer, thus it is
     * quite not direct.
     *
     * @param accountNo
     * @param who
     */
    async getCustomerWorkOrders(accountNo, who) {
        const Customer = DomainFactory.build(DomainFactory.CUSTOMER);
        const customer = new Customer({account_no: accountNo});
        const [billings, assets] = await Promise.all([customer.disconnectionBilling(), customer.asset()]);
        const cols = [
            'id',
            'work_order_no',
            "related_to",
            "relation_id",
            "type_id",
            "labels",
            "status",
            "priority",
            "summary",
            "address_line",
            "start_date",
            "completed_date",
            "assigned_to",
            "created_at",
            "updated_at"
        ];
        const workOrders = [];

        for (let billing of billings.records) {
            const workOrder = await billing.workOrders(cols);
            if (workOrder.records.length > 0) {
                workOrder.records.forEach(work => work['disconnections'] = billing);
                workOrders.push(...workOrder.records);
            }
        }

        //from asset we need to get all the fault and then the work orders
        //For lack of proper DB Queries we are going to fetch this one after the other
        for (let asset of assets.records) {
            const faults = await asset.faults();
            for (const fault of faults.records) {
                const workOrder = await fault.workOrders(cols);
                if (workOrder.records.length > 0) workOrders.push(...workOrder.records);
            }
        }
        return Utils.buildResponse({data: {items: orderBy(workOrders, ["id"], ["desc"])}});
    }


    /**
     * For getting dataTable records
     *
     * @param body
     * @param who
     * @returns {Promise<IDtResponse>}
     */
    async getCustomerTableRecords(body, who){
        const customerDataTable = new CustomerDataTable(this.context.database, MapperFactory.build(MapperFactory.CUSTOMER));
        const editor = await customerDataTable.addBody(body).make();
        return editor.data();
    }

    /**
     *
     * @param by
     * @param value
     * @returns {*}
     */
    deleteCustomer(by = "account_no", value) {
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