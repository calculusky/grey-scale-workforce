const MDataTables = require('../../../../core/MDataTables');
const {Field} = require('datatables.net-editor-server');

class RoleDataTable extends MDataTables {

    /**
     *
     * @param db
     * @param mapper {RoleMapper}
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
            new Field('id'),
            new Field('name'),
            new Field('slug'),
            new Field('created_at')
        );
        return super.addFields(...fields);
    }

}

module.exports = RoleDataTable;
