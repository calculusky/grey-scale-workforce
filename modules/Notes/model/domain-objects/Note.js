//noinspection JSUnresolvedFunction
const DomainObject = require('../../../../core/model/DomainObject');
//noinspection JSUnresolvedFunction
const map = require('./map.json');

/**
 * @author Paul Okeke
 * Created by paulex on 8/22/17.
 * @name Note
 */
class Note extends DomainObject {

    constructor(data) {
        super(data, map);
        /*PLEASE DON'T PUT instance fields here that are not mapped to DB*/
    }

    required() {
        return [
            'relation_id',
            'module',
            'note',
            'created_by'
        ];
    }

    guard() {
        return [
            'api_instance_id',
            'id'
        ];
    }

    softDeletes() {
        return [
            false,
            "deleted_at"
        ];
    }

    rules() {
        return {
            relation_id: 'numeric|required',
            module: 'string|required',
            note: 'string|required',
            created_by: 'integer|required'
        };
    }


    user() {
        return this.relations().belongsTo("User", "created_by");
    }

    /**
     * Returns all the attachment on the note if any
     * @returns {Promise}
     */
    attachments(){
        return this.relations().morphMany("Attachment", "module", "relation_id");
    }
}

//noinspection JSUnresolvedVariable
module.exports = Note;