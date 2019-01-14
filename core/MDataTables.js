const {Editor} = require('datatables.net-editor-server');
const ApiService = require('../modules/ApiService');

/**
 * @name MDataTables
 */
class MDataTables {

    /**
     *
     * @param db
     * @param modelMapper {ModelMapper|NoteMapper|WorkOrderMapper}
     */
    constructor(db, modelMapper) {
        if (!modelMapper) throw new TypeError("ModelMapper cannot be null");
        this.mapper = modelMapper;
        this.permissionKey = `${this.mapper.tableName}.index`;
        this.usePermission = true;
        this.editor = new Editor(db, modelMapper.tableName, modelMapper.primaryKey);
        this.isFieldSet = false;
        this.body = {};
    }

    /**
     *
     * @returns {Editor}
     */
    getEditor() {
        return this.editor;
    }

    /**
     *
     * @param fields
     * @returns {MDataTables}
     */
    addFields(...fields) {
        this.editor.fields(...fields);
        this.isFieldSet = true;
        return this;
    }

    /**
     * Request.Body from the client
     *
     * @param body
     * @returns {MDataTables}
     */
    addBody(body) {
        this.body = body;
        return this;
    }

    setPermissionKey(key) {
        this.permissionKey = key;
        return this;
    }

    enablePermission(state = true) {
        this.usePermission = state;
        return this;
    }


    setSession(who) {
        this.session = who;
        return this;
    }

    /**
     * This method can be overridden to manipulate queries of the editor
     *
     * @param editor {Editor}
     */
    beforeProcess(editor) {
        if (!this.isFieldSet) this.addFields();
        if (this.usePermission && this.permissionKey)
            ApiService.queryWithPermissions(this.permissionKey, editor, this.mapper, this.session);
        this.editor.where(`${this.mapper.tableName}.deleted_at`, null);
    }

    /**
     *
     * @param editor {Editor}
     */
    afterProcess(editor) {

    }

    /**
     *
     * @returns {Promise<Editor>}
     */
    async make() {
        this.beforeProcess(this.editor);
        await this.editor.process(this.body);
        this.afterProcess(this.editor);
        return this.editor;
    }

}

module.exports = MDataTables;
