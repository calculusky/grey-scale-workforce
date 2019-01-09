const MDataTables = require('../../../../core/MDataTables');
const {Field, Format} = require('datatables.net-editor-server');
const ApiService = require('../../../ApiService');

class UserDataTable extends MDataTables {

    /**
     *
     * @param db
     * @param mapper {UserMapper}
     * @param who
     */
    constructor(db, mapper, who={}) {
        super(db, mapper);
        this.mapper = mapper;
        this.session = who;
    }

    addFields(...fields) {
        fields.push(
            new Field('first_name'),
            new Field('last_name'),
            new Field('username'),
            new Field('email'),
            new Field('user_type'),
            new Field('created_at')
                .getFormatter(Format.sqlDateToFormat("d M, Y LTS")),
        );
        return super.addFields(...fields);
    }

    /**
     * @param editor
     * @private
     */
    beforeProcess(editor){
        ApiService.queryWithPermissions("users.index", editor, this.mapper, this.session);
        this.editor.where("deleted_at", null);
    }

}

module.exports = UserDataTable;
