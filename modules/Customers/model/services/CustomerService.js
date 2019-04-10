const DomainFactory = require('../../../DomainFactory');
const ApiService = require('../../../ApiService');
let MapperFactory = null;
const Utils = require('../../../../core/Utility/Utils');
const Error = require('../../../../core/Utility/ErrorUtils')();
const {orderBy} = require("lodash");
const CustomerDataTable = require('../commons/CustomerDataTable');

/**
 * @name CustomerService
 * Created by paulex on 09/4/17.
 */
class CustomerService extends ApiService {

    constructor(context) {
        super(context);
        this.context = context;
        MapperFactory = this.context.modelMappers;
    }

    /**
     * @param value {String|Number}
     * @param by {String}
     * @param who {Session}
     * @param offset {Number}
     * @param limit {Number}
     * @param includes {Array}
     * @returns {Promise<{data?: *, code?: *}>}
     */
    async getCustomer(value, by = "account_no", who, offset = 0, limit = 10, includes = ['assets']) {
        const CustomerMapper = MapperFactory.build(MapperFactory.CUSTOMER);
        const results = await CustomerMapper.findDomainRecord({by, value}, offset, limit);
        const groups = await this.context.getKey("groups", true);
        const customers = CustomerService.addBUAndUTAttributes(results.records, groups);
        if (includes.includes("assets"))
            for (const customer of customers) customer.assets = (await customer.asset()).records;
        return Utils.buildResponse({data: {items: customers}});
    }

    /**
     * Queries for customer records
     *
     * @param query {Object}
     * @param who {Session}
     * @returns {Promise<{data?: *, code?: *}>}
     */
    async getCustomers(query = {}, who) {
        const results = await this.buildQuery(query).catch(() => Error.InternalServerError);
        const groups = await this.context.getKey("groups", true);
        const Customer = DomainFactory.build(DomainFactory.CUSTOMER);
        const assets = CustomerService.addBUAndUTAttributes(results, groups, Customer);
        return Utils.buildResponse({data: {items: assets}});
    }

    /**
     * @param body
     * @param who {Session}
     */
    createCustomer(body = {}, who) {
        const Customer = DomainFactory.build(DomainFactory.CUSTOMER);
        const customer = new Customer(body);

        ApiService.insertPermissionRights(customer, who);

        if (!customer.validate()) return Promise.reject(Error.ValidationFailure(customer.getErrors().all()));

        const CustomerMapper = MapperFactory.build(MapperFactory.CUSTOMER);
        return CustomerMapper.createDomainRecord(customer, [], who).then(customer => {
            if (!customer) return Promise.reject();
            return Utils.buildResponse({data: customer});
        });
    }

    /**
     *
     * @param by
     * @param value
     * @param body
     * @param who
     * @param API
     * @param files
     * @return {Promise<*>}
     */
    async updateCustomer(by = "account_no", value, body = {}, who, API, files = []) {
        const Customer = DomainFactory.build(DomainFactory.CUSTOMER);
        const CustomerMapper = MapperFactory.build(MapperFactory.CUSTOMER);
        const model = (await CustomerMapper.findDomainRecord({by, value})).records.shift();
        const customer = new Customer(body);

        if (!model) return Promise.reject(Error.RecordNotFound());

        return CustomerMapper.updateDomainRecord({by, value, domain: customer}, who).then(result => {
            const [updateRecord] = result;
            return Utils.buildResponse({data: updateRecord});
        });
    }

    /**
     * We are majorly searching for customers by account_no and meter_no
     *
     * @param keyword
     * @param who {Session}
     * @param offset
     * @param limit
     * @returns {Promise.<*>}
     */
    async searchCustomers(keyword, who, offset = 0, limit = 10) {
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
        let resultSets = this.context.db().select(fields).from('customers')
            .where('account_no', 'like', `%${keyword}%`)
            .where("deleted_at", null)
            .orWhere('meter_no', 'like', `%${keyword}%`)
            .limit(parseInt(limit)).offset(parseInt(offset)).orderBy('account_no', 'asc');

        const groups = await this.context.getKey("groups", true);
        const results = await resultSets.catch(err => (Utils.buildResponse({status: "fail", data: err}, 500)));
        const customers = CustomerService.addBUAndUTAttributes(results, groups, Customer);

        return Utils.buildResponse({data: {items: customers}});
    }

    /**
     * Fetches work-orders that has a relationship with customers
     *
     * Note : Work Orders might not be directly related to customers, however a relationship
     *        through other entities might exist
     *
     * Most work-orders are primarily not related to a customer, thus it is
     * quite not direct.
     *
     * @param accountNo
     * @param who {Session}
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
        //From asset we need to get all the fault and then the work orders
        //For lack of proper DB Queries we are going to fetch this one after the other
        for (let asset of assets.records) {
            const faults = await asset.faults();
            for (const fault of faults.records) {
                const workOrder = await fault.workOrders(cols);
                workOrder.records.forEach(work => work['fault'] = fault);
                if (workOrder.records.length > 0) workOrders.push(...workOrder.records);
            }
        }
        return Utils.buildResponse({data: {items: orderBy(workOrders, ["id"], ["desc"])}});
    }

    /**
     * For getting dataTable records
     *
     * @param body {Object}
     * @param who {Session}
     * @returns {Promise<IDtResponse>}
     */
    async getCustomerTableRecords(body, who) {
        const CustomerMapper = MapperFactory.build(MapperFactory.CUSTOMER);
        const customerDataTable = new CustomerDataTable(this.context.db(), CustomerMapper, who);
        const editor = await customerDataTable.addBody(body).make();
        return editor.data();
    }

    /**
     *
     * @param by {String}
     * @param value {String|Number}
     * @param who {Session}
     * @returns {*}
     */
    deleteCustomer(by = "account_no", value, who) {
        const CustomerMapper = MapperFactory.build(MapperFactory.CUSTOMER);
        return CustomerMapper.deleteDomainRecord({by, value}, true, who).then(count => {
            if (!count) return Error.RecordNotFound();
            return Utils.buildResponse({data: {message: "Customer successfully deleted."}});
        });
    }

    /**
     * @param query {Object}
     * @return {Promise<*>}
     */
    async buildQuery(query = {}) {
        const {meter_no, type, tariff, status, offset = 0, limit = 10} = query;
        const resultSets = this.context.db().select(['*']).from('customers');

        if (meter_no) resultSets.where("meter_no", meter_no);
        if (type) resultSets.where("customer_type", type);
        if (tariff) resultSets.where("tariff", tariff);
        if (status) resultSets.whereIn('status', `${status}`.split(","));

        resultSets.where('deleted_at', null).limit(Number(limit)).offset(Number(offset)).orderBy('account_no', 'asc');

        return resultSets;
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