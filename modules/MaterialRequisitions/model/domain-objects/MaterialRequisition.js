//noinspection JSUnresolvedFunction
const DomainObject = require('../../../../core/model/DomainObject');
//noinspection JSUnresolvedFunction
const map = require('./map.json');

/**
 * @author Paul Okeke
 * Created by paulex on 6/05/18.
 * @name MaterialRequisition
 */
class MaterialRequisition extends DomainObject {

    constructor(data) {
        super(data, map);
        /*PLEASE DON'T PUT instance fields here that are not mapped to DB*/
    }

    required() {
        return [
            'materials'
        ];
    }

    guard() {
        return [
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
            "materials": "required|array",
            "materials.*.id": "required|numeric",
            "materials.*.category.id": "required",
            work_order_id: 'string',
            requested_by: 'numeric|required'
        };
    }

    setRequestById(id) {
        this['requested_by'] = id;
    }

    /**
     * Get materials associated with a material requisition
     *
     * @param db
     * @param cols
     * @returns {*}
     */
    getMaterials(db, cols = ['id', 'name', 'unit_of_measurement', 'unit_price', 'total_quantity', 'created_at', 'updated_at', 'assigned_to']) {
        if (!this.materials || this.materials.length === 0) return [];
        const filtered = this.materials.filter(i => i['id'] && i['source'] !== 'ie_legend');
        return db.table("materials").whereIn('id', filtered.map(({id}) => id)).where("deleted_at", null).select(cols)
    }

    requestedBy() {
        return this.relations().belongsTo("User", "requested_by", ['id', 'username', 'first_name', 'last_name']);
    }

    approvedBy() {
        return this.relations().belongsTo("User", "approved_by", ['id', 'username', 'first_name', 'last_name']);
    }

    workOrder() {
        return this.relations().belongsTo("WorkOrder", "work_order_id");
    }
}

//noinspection JSUnresolvedVariable
module.exports = MaterialRequisition;