const MDataTables = require('../../../../core/MDataTables');
const {Field} = require('datatables.net-editor-server');

class FaultDataTable extends MDataTables {

    /**
     *
     * @param db
     * @param mapper {GroupMapper}
     * @param who {Session}
     */
    constructor(db, mapper, who) {
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
            new Field('faults.id', 'fault_id'),
            new Field('assets.asset_name', 'asset_name'),
            new Field('customers.customer_name', 'customer_name'),
            new Field('faults.summary', 'summary'),
            new Field('faults.priority', 'priority'),
            new Field('faults.status', 'status'),
            new Field('faults.created_at', 'created_at')
        );
        super.addFields(...fields);
        this.editor.leftJoin('assets', 'assets.id', '=', 'faults.relation_id');
        return this;
    }

}

module.exports = FaultDataTable;
