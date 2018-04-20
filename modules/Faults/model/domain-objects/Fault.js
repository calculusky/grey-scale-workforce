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
            'priority',
            'related_to',
            'relation_id',
            'category_id',
            'group_id'
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
            true,
            "deleted_at"
        ];
    }

    rules() {
        return {
            summary: 'string|required',
            related_to: 'string|required',
            relation_id: 'string|required',
            category_id: 'numeric|required',
            status: 'numeric|required',
            group_id: 'numeric|required',
            priority: 'numeric|required',
            issue_date: 'date|required'
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
    asset() {
        return this.relations().belongsTo("Asset", 'relation_id');
    }

    /**
     * Returns the customer this fault was created for
     * @returns {*}
     */
    customer() {
        return this.relations().belongsTo("Customer", 'relation_id', 'account_no');
    }

    /**
     * Returns the notes for this fault
     * @returns {Promise}
     */
    notes() {
        return this.relations().morphMany("Note", 'module', 'relation_id');
    }

    /**
     * Returns the attachments for this fault
     * @returns {Promise}
     */
    attachments() {
        return this.relations().morphMany("Attachment", "module", "relation_id");
    }
}

//noinspection JSUnresolvedVariable
module.exports = Fault;