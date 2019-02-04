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
        this.note = null;
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
            module: 'string|required|in:work_orders,faults',
            note: 'string|required',
            created_by: 'integer|required'
        };
    }


    user(cols=["id", "username", "first_name", "last_name", "mobile_no", "gender", "avatar"]) {
        return this.relations().belongsTo("User", "created_by", "id", cols);
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