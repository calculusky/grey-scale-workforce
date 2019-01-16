const ApiService = require('../../../ApiService');
const DomainFactory = require('../../../DomainFactory');
const Utils = require('../../../../core/Utility/Utils');
const Error = require('../../../../core/Utility/ErrorUtils')();
const validate = require('validatorjs');
const DisconnectionBillingDataTable = require('../commons/DisconnectionBillingDataTable');
let MapperFactory = null;

/**
 * @author Paul Okeke
 * @name DisconnectionBillingService
 * Created by paulex on 8th-Jan-2019.
 */
class DisconnectionBillingService extends ApiService {
    /**
     *
     * @param context
     */
    constructor(context) {
        super(context);
        MapperFactory = this.context.modelMappers;
    }


    /**
     *
     * @param query
     * @param who
     * @returns {Promise}
     */
    async getDisconnectionBillings(query = {}, who = {}) {
        return Utils.buildResponse({data: {items: []}});
    }

    /**
     *
     *
     * @param body {Object}
     * @param who
     * @param files
     * @param API {API}
     */
    async createDisconnectionBilling(body = {}, who = {}, files = [], API) {
        const db = this.context.database;
        const {work_order: workOrder} = body;
        const DisconnectionBilling = DomainFactory.build(DomainFactory.DISCONNECTION_ORDER);
        const dBilling = new DisconnectionBilling(body);

        Utils.numericToInteger(dBilling, 'current_bill', 'arrears');

        dBilling.assigned_to = Utils.serializeAssignedTo(dBilling.assigned_to);

        ApiService.insertPermissionRights(dBilling, who);

        const validator = new validate(dBilling, dBilling.rules(), dBilling.customErrorMessages());
        if (validator.fails(null)) return Promise.reject(Error.ValidationFailure(validator.errors.all()));

        //We need to check if the customer exist and get the customer tariff
        const {data: {data: {items: [customer]}}} = await API.customers().getCustomer(dBilling.account_no, 'account_no', who);

        if (!customer) return Promise.reject(Error.FormRecordNotFound('account_no'));

        //Get the default reconnection fee for this customer tariff
        let [fee] = await db.table("rc_fees").where('name', customer.tariff).select(['amount']);
        fee = (fee) ? fee : 3000;

        dBilling.min_amount_payable = dBilling.current_bill + dBilling.arrears;
        dBilling.reconnection_fee = fee;
        dBilling.total_amount_payable = dBilling.current_bill + dBilling.arrears + fee;

        const DisconnectionBillingMapper = MapperFactory.build(MapperFactory.DISCONNECTION_ORDER);
        const record = await DisconnectionBillingMapper.createDomainRecord(dBilling).catch(err => (Promise.reject(err)));
        if (workOrder) {
            workOrder.related_to = "disconnection_billings";
            workOrder.relation_id = `${record.id}`;
            workOrder.type_id = 1;
            const {data: {data: order}} = await API.workOrders().createWorkOrder(workOrder, who, files, API).catch(err => {
                this.deleteDisconnectionBilling('id', record.id).catch(console.error);
                return Promise.reject(err);
            });
            db.table("disconnection_billings").update({work_order_id: order.work_order_no}).where('id', record.id).catch(console.error);
            return Utils.buildResponse({data: order});
        }
        return Utils.buildResponse({data: record});
    }

    /**
     * For getting dataTable records
     *
     * @param body
     * @param who
     * @returns {Promise<IDtResponse>}
     */
    async getDisconnectionBillingDataTableRecords(body, who){
        console.log(body);
        const billingDataTable = new DisconnectionBillingDataTable(this.context.database, MapperFactory.build(MapperFactory.DISCONNECTION_ORDER));
        const editor = await billingDataTable.addBody(body).make().catch(err=>{
            console.log(err);
        });
        return editor.data();
    }



    /**
     *
     * @param by
     * @param value
     * @param who
     * @param API
     * @returns {*}
     */
    deleteDisconnectionBilling(by = "id", value, who, API) {
        const DisconnectionBillingMapper = MapperFactory.build(MapperFactory.FAULT);
        return DisconnectionBillingMapper.deleteDomainRecord({by, value}, true, who).then(count => {
            if (!count) {
                return Utils.buildResponse({status: "fail", data: {message: "The specified record doesn't exist"}});
            }
            return Utils.buildResponse({data: {by, message: "DisconnectionBilling deleted"}});
        });
    }
}

module.exports = DisconnectionBillingService;