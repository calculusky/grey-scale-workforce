const MDataTables = require('../../../../core/MDataTables');
const {Field} = require('datatables.net-editor-server');

class CustomerDataTable extends MDataTables {

    /**
     *
     * @param db
     * @param mapper {GroupMapper}
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
            new Field('account_no'),
            new Field('customer_name'),
            new Field('mobile_no'),
            new Field('email'),
            new Field('customer_type'),
            new Field('status').getFormatter(val => {
                switch(val){
                    case 0: return "Unknown";
                    case 1: return "Active";
                    case 2: return "Suspended";
                    default: return "Unknown";
                }
            }),
            new Field('created_at')
        );
        return super.addFields(...fields);
    }

}

module.exports = CustomerDataTable;
