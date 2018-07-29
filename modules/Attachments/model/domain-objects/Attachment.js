//noinspection JSUnresolvedFunction
const DomainObject = require('../../../../core/model/DomainObject');
//noinspection JSUnresolvedFunction
const map = require('./map.json');

/**
 * @author Paul Okeke
 * Created by paulex on 8/22/17.
 * @name Attachment
 */
class Attachment extends DomainObject {

    constructor(data) {
        super(data, map);
        /*PLEASE DON'T PUT instance fields here that are not mapped to DB*/
    }

    required() {
        return [
            'relation_id',
            'module',
            'created_by',
            'file_name',
            'file_size',
            'file_path',
            'file_type'
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
            "deleted_at"
        ];
    }

    rules() {
        return {
            relation_id: 'integer|required',
            attachment_by: 'numeric|required',
            module: 'string|required',
            file_path: 'string|required',
            file_type: 'string|required'
        };
    }


    user(cols = ["id", "username", "first_name", "last_name"]) {
        return this.relations().belongsTo("User", "created_by", cols);
    }
}

//noinspection JSUnresolvedVariable
module.exports = Attachment;