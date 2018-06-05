//noinspection JSUnresolvedFunction
const DomainObject = require('../../../../core/model/DomainObject');
//noinspection JSUnresolvedFunction
const map = require('./map.json');

/**
 * @author Paul Okeke
 * Created by paulex on 8/22/17.
 * @name Asset
 */
class Asset extends DomainObject {

    constructor(data) {
        super(data, map);
        /*PLEASE DON'T PUT instance fields here that are not mapped to DB*/
    }

    required() {
        return [
            'material_id',
            'work_order_id'
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
            requested_by: 'numeric|required'
        };
    }

}

//noinspection JSUnresolvedVariable
module.exports = Asset;