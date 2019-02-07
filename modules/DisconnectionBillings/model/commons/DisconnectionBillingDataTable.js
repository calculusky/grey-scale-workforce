const MDataTables = require('../../../../core/MDataTables');
const {Field} = require('datatables.net-editor-server');
// const Utils = require('../../../../core/Utility/Utils');

class DisconnectionBillingDataTable extends MDataTables {

    /**
     *
     * @param db
     * @param mapper {DisconnectionBillingMapper}
     * @param who
     */
    constructor(db, mapper, who = {}) {
        super(db, mapper);
        this.setSession(who);
    }

    /**
     *
     * @param fields
     * @returns {MDataTables}
     */
    addFields(...fields) {
        fields.push(
            new Field(`${this.mapper.tableName}.id`, 'checkbox'),
            new Field('customers.account_no', 'account_no'),
            new Field('customers.customer_name', 'customer_name'),
            new Field('groups.name', 'undertaking'),
            new Field("assets.asset_name", 'asset_name'),
            new Field(`${this.mapper.tableName}.current_bill`, 'current_bill'),
            new Field(`${this.mapper.tableName}.arrears`, 'arrears'),
        );
        this.editor
            .leftJoin('customers', `${this.mapper.tableName}.account_no`, '=', 'customers.account_no')
            .leftJoin('customers_assets', 'customers_assets.customer_id', '=', 'customers.account_no')
            .leftJoin('assets', 'assets.id', '=', 'customers_assets.asset_id')
            .leftJoin('groups', 'groups.id', '=', 'customers.group_id');
        return super.addFields(...fields);
    }


}

module.exports = DisconnectionBillingDataTable;
