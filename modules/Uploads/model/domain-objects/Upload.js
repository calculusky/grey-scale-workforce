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
            'note_by'
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
            "deleted",
            "deleted_at"
        ];
    }

    rules() {
        return {
            relation_id: Number,
            module: String,
            note: String,
            note_by: Number
        };
    }


    user() {
        return this.relations().belongsTo("User", "note_by");
    }
}

//noinspection JSUnresolvedVariable
module.exports = Note;