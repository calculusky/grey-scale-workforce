//noinspection JSUnresolvedFunction
const DomainObject = require('../../../../core/model/DomainObject');
//noinspection JSUnresolvedFunction
const map = require('./map.json');

/**
 * @author Paul Okeke
 * Created by paulex on 6/05/18.
 * @name StockMovement
 */
class StockMovement extends DomainObject {

    constructor(data) {
        super(data, map);
        /*PLEASE DON'T PUT instance fields here that are not mapped to DB*/
    }

    required() {
        return [];
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
            group_id: 'numeric|required',
            quantity: 'numeric|required',
            type: 'string|required',
            who: 'string|required',
        };
    }


    user() {
        return this.relations().belongsTo("User", "assigned_to");
    }
}

//noinspection JSUnresolvedVariable
module.exports = StockMovement;