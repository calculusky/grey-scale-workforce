const {Editor} = require('datatables.net-editor-server');

/**
 * @name MDataTables
 */
class MDataTables{

    /**
     *
     * @param db
     * @param modelMapper {ModelMapper|NoteMapper|WorkOrderMapper}
     */
    constructor(db, modelMapper){
        if(!modelMapper) throw new TypeError("ModelMapper cannot be null");
        this.editor = new Editor(db, modelMapper.tableName, modelMapper.primaryKey);
        this.body = {};
    }

    /**
     *
     * @returns {Editor}
     */
    getEditor() {return this.editor;}

    /**
     *
     * @param fields
     * @returns {MDataTables}
     */
    addFields(...fields){
        this.editor.fields(...fields);
        return this;
    }

    /**
     * Request.Body from the client
     *
     * @param body
     * @returns {MDataTables}
     */
    addBody(body){
        this.body = body;
        return this;
    }

    /**
     * This method can be overridden to manipulate queries of the editor
     *
     * @param editor {Editor}
     */
    beforeProcess(editor){

    }

    /**
     *
     * @param editor {Editor}
     */
    afterProcess(editor){

    }

    /**
     *
     * @returns {Promise<Editor>}
     */
    async make(){
        this.beforeProcess(this.editor);
        await this.editor.process(this.body);
        this.afterProcess(this.editor);
        return this.editor;
    }

}

module.exports = MDataTables;
