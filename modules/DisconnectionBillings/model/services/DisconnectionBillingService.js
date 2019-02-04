const ApiService = require('../../../ApiService');
const DomainFactory = require('../../../DomainFactory');
const Utils = require('../../../../core/Utility/Utils');
const Error = require('../../../../core/Utility/ErrorUtils')();
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
     * Creates a disconnection billing record
     *
     * @param body {Object}
     * @param who {Session}
     * @param files {Array}
     * @param API {API}
     */
    async createDisconnectionBilling(body = {}, who, files = [], API) {
        const db = this.context.db();
        const {work_order: workOrder} = body;
        const DisconnectionBilling = DomainFactory.build(DomainFactory.DISCONNECTION_ORDER);
        const dBilling = new DisconnectionBilling(body);

        Utils.numericToInteger(dBilling, 'current_bill', 'arrears');

        dBilling.serializeAssignedTo();

        ApiService.insertPermissionRights(dBilling, who);

        if(!dBilling.validate()) return Promise.reject(Error.ValidationFailure(dBilling.getErrors().all()));

        //We need to check if the customer exist and get the customer tariff
        const {data: {data: {items: [customer]}}} = await API.customers().getCustomer(dBilling.account_no, 'account_no', who);

        if (!customer) return Promise.reject(Error.FormRecordNotFound('account_no'));

        //Get the default reconnection fee for this customer tariff
        let [{amount: fee}] = await db.table("rc_fees").where('name', customer.tariff).select(['amount']);
        fee = (fee) ? fee : 3000;

        dBilling.calculateMinAmount();
        dBilling.setReconnectionFee(fee);
        dBilling.calculateTotalAmount();

        const DisconnectionBillingMapper = MapperFactory.build(MapperFactory.DISCONNECTION_ORDER);
        const record = await DisconnectionBillingMapper.createDomainRecord(dBilling, who).catch(err => (Promise.reject(err)));
        if (workOrder) {
            workOrder.related_to = "disconnection_billings";
            workOrder.relation_id = `${record.id}`;
            workOrder.type_id = 1;
            const {data: {data: work_order}} = await API.workOrders().createWorkOrder(workOrder, who, files, API).catch(err => {
                this.deleteDisconnectionBilling('id', record.id, who, API).catch(console.error);
                return Promise.reject(err);
            });
            db.table("disconnection_billings").update({work_order_id: work_order.work_order_no}).where('id', record.id).catch(console.error);
            return Utils.buildResponse({data: {...record, work_order}});
        }
        return Utils.buildResponse({data: record});
    }

    /**
     * For getting dataTable records
     *
     * @param body {Object}
     * @param who {Session}
     * @returns {Promise<IDtResponse>}
     */
    async getDisconnectionBillingDataTableRecords(body, who){
        const DisconnectionBillingMapper = MapperFactory.build(MapperFactory.DISCONNECTION_ORDER);
        const billingDataTable = new DisconnectionBillingDataTable(this.context.db(), DisconnectionBillingMapper, who);
        const editor = await billingDataTable.addBody(body).make().catch(console.error);
        return editor.data();
    }

    /**
     * Deletes a disconnection billing
     *
     * @param by {String}
     * @param value {String|Number}
     * @param who {Session}
     * @param API {API}
     * @returns {*}
     */
    deleteDisconnectionBilling(by = "id", value, who, API) {
        const DisconnectionBillingMapper = MapperFactory.build(MapperFactory.DISCONNECTION_ORDER);
        return DisconnectionBillingMapper.deleteDomainRecord({by, value}, true, who).then(count => {
            if (!count) return Promise.reject(Error.RecordNotFound());
            return Utils.buildResponse({data: {by, message: "DisconnectionBilling deleted"}});
        });
    }
}

module.exports = DisconnectionBillingService;