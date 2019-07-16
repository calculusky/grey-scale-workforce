//noinspection JSUnresolvedFunction
const DomainObject = require('../../../../core/model/DomainObject');
//noinspection JSUnresolvedFunction
const map = require('./material.category.map');

/**
 * @author Paul Okeke
 * Created by paulex on 06/14/19.
 * @name MaterialCategory
 */
class MaterialCategory extends DomainObject {

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
            name: 'string|required',
            source: 'required_with:source_id',
            source_id: 'required_with:source',
            parent_id: 'number'
        };
    }

    isAuditAble() {
        return false;
    }

}

//noinspection JSUnresolvedVariable
module.exports = MaterialCategory;