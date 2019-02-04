const MDataTables = require('../../../../core/MDataTables');
const {Field} = require('datatables.net-editor-server');

class UserDataTable extends MDataTables {

    /**
     *
     * @param db
     * @param mapper {UserMapper}
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
            new Field('first_name'),
            new Field('last_name'),
            new Field('username'),
            new Field('email'),
            new Field('user_type'),
            new Field('created_at')
        );
        return super.addFields(...fields);
    }

}

module.exports = UserDataTable;
