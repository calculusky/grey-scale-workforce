//noinspection JSUnresolvedFunction
const DomainObject = require('../../../../core/model/DomainObject');
//noinspection JSUnresolvedFunction
const map = require('./map.json');

/**
 * @author Paul Okeke
 * Created by paulex on 06/17/18.
 * @name MaterialUtilization
 */
class MaterialUtilization extends DomainObject {

    constructor(data) {
        super(data, map);
        /*PLEASE DON'T PUT instance fields here that are not mapped to DB*/
    }

    required() {
        return [
            'material_id'
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
            material_id: 'numeric|required',
            work_order_id: 'numeric|required',
            quantity: 'numeric|required',
            description: 'string|required'
        };
    }

    getMaterial() {
        return this.relations().belongsTo("Material", "material_id");
    }
}

//noinspection JSUnresolvedVariable
module.exports = MaterialUtilization;