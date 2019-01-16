const MDataTables = require('../../../../core/MDataTables');
const {Field} = require('datatables.net-editor-server');
const Utils = require('../../../../core/Utility/Utils');

class UploadDataTable extends MDataTables {

    /**
     *
     * @param db
     * @param mapper {UploadMapper}
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
            new Field('original_file_name', 'file_name'),
            new Field('upload_type'),
            new Field('status').getFormatter(val => Utils.getUploadStatus(val)),
            new Field('message'),
            new Field('created_at')
        );
        return super.addFields(...fields);
    }

}

module.exports = UploadDataTable;
