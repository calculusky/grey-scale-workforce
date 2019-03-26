//noinspection JSUnresolvedFunction
const DomainObject = require('../../../../core/model/DomainObject');
//noinspection JSUnresolvedFunction
const map = require('./map.json');
const {getFaultStatus, getFaultPriority} = require('../../../../core/Utility/Utils');

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
            "deleted_at",
            "deleted_by"
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
            issue_date: 'date|required',
            labels: 'string-array',//please note that this are customer-validators
            assigned_to: 'string-array',
            metadata:'string-object'
        };
    }

    setIssueDate(date) {
        this.issue_date = date;
        return this;
    }

    /**
     *
     * @param date
     * @returns {Fault}
     */
    setIssueDateIfNull(date) {
        if (!this.issue_date)
            this.issue_date = date;
        return this;
    }

    /**
     * Sets the category using the categoryId
     *
     * @param source
     */
    setCategory(source) {
        if (!this.category_id || !source) return;
        this.category = source[this.category_id] || null;
    }

    /**
     *
     * @param db
     * @returns {Promise<boolean>}
     */
    async validateSource(db) {
        if (this.source && this.source.toLowerCase() === "crm") {
            const asset = (await db(this.related_to).where('id', this.relation_id)
                .orWhere('ext_code', this.relation_id).select(['id', 'group_id'])).shift();
            if (!asset) return false;
            this.relation_id = `${asset.id}`;
        }
        return true;
    }

    getNotesCount(db) {
        if (!this.id) return console.assert(this.id, "Fault ID is not set");
        return db.count('note as notes_count')
            .from("notes").where("module", "faults").where("relation_id", this.id);
    }

    getAttachmentsCount(db) {
        if (!this.id) return console.assert(this.id, "Fault ID is not set");
        return db.count('id as attachments_count')
            .from("notes").where("module", "faults").where("relation_id", this.id);
    }

    getWorkOrdersCount(db) {
        if (!this.id) return console.assert(this.id, "Fault ID is not set");
        return db.count('id as works_count')
            .from("work_orders").where("related_to", "faults").where("relation_id", this.id)
    }

    getRelatedRecordCount(db) {
        return [
            this.getNotesCount(db),
            this.getAttachmentsCount(db),
            this.getWorkOrdersCount(db)
        ];
    }

    /**
     *
     * @param context
     * @return {{}|*}
     */
    toAuditAbleFormat(context) {
        const newData = {...this};
        for (const [key, value] of Object.entries(newData)) {
            switch (key) {
                case 'relation_id': {
                    //TODO check if the related value is an asset
                    break;
                }
                case 'category_id' || 'fault_category_id': {
                    context.getKey("fault:categories", true).then(categories => {
                        newData[key] = categories[value].name;
                    });
                    break;
                }
                case 'status': {
                    newData[key] = getFaultStatus(value);
                    break;
                }
                case 'priority': {
                    newData[key] = getFaultPriority(value);
                    break;
                }
                case 'labels': {
                    if (typeof value === 'string') newData[key] = JSON.parse(value);
                    break;
                }
                case 'assigned_to': {
                    if (typeof value === 'string') newData[key] = JSON.parse(value);
                    break;
                }
            }
        }
        return newData;
    }

    /**
     *
     * @returns {*}
     */
    relatedTo() {
        return this.relations().morphTo("related_to", 'relation_id', ["*"]);
    }

    /**
     * Fetches all the work orders related to this fault
     *
     * @returns {Promise}
     */
    workOrders(cols = ['id', 'work_order_no', "related_to", "relation_id", "type_id", "status"]) {
        return this.relations().morphMany("WorkOrder", "related_to", 'relation_id', undefined, cols);
    }

    /**
     * Returns the User that owns the fault
     * @returns {Promise}
     */
    createdBy(cols = ["id", "username", "first_name", "last_name"]) {
        return this.relations().belongsTo("User", "created_by", cols);
    }

    /**
     * Returns the associated Asset for this fault
     * @returns {Promise}
     */
    asset(cols = ['id', 'asset_name', 'asset_type', 'status', 'location']) {
        return this.relations().belongsTo("Asset", 'relation_id', cols);
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