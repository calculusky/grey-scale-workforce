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
            materials: 'string|required',
            work_order_id: 'string',
            requested_by: 'numeric|required'
        };
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