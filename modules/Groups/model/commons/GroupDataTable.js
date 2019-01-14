const MDataTables = require('../../../../core/MDataTables');
const {Field} = require('datatables.net-editor-server');

class GroupDataTable extends MDataTables {

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
            new Field('name'),
            new Field('description'),
            new Field('created_at')
        );
        return super.addFields(...fields);
    }

}

module.exports = GroupDataTable;
