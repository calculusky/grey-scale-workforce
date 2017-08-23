//noinspection JSUnresolvedFunction
const DomainObject = require('../../../../core/model/DomainObject');
//noinspection JSUnresolvedFunction
const map = require('./map.json');

/**
 * @author Paul Okeke
 * Created by paulex on 7/4/17.
 * @name Fault
 */
class Fault extends DomainObject {

    constructor(data) {
        super(data, map);
        /*PLEASE DON'T PUT instance fields here that are not mapped to DB*/
    }

    required() {
        return [
            'summary',
            'issue_date',
            'status',
            'priority',
            'asset_id'
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
            name: String
        };
    }

    /**
     * Returns the User that owns the fault
     * @returns {Promise}
     */
    user() {
        return this.relations().belongsTo("User", "assigned_to");
    }

    /**
     * Returns the associated Asset for this fault
     * @returns {Promise}
     */
    asset(){
        return this.relations().belongsTo("Asset");
    }

    /**
     * Returns the notes for this fault
     * @returns {Promise}
     */
    notes(){
        return this.relations().morphMany("Note", 'module', 'relation_id');
    }

    /**
     * Returns the attachments for this fault
     * @returns {Promise}
     */
    attachments(){
        return this.relations().morphMany("Attachment", "module", "relation_id");
    }
}

//noinspection JSUnresolvedVariable
module.exports = Fault;