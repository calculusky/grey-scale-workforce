//noinspection JSUnresolvedFunction
const DomainObject = require('../../../../core/model/DomainObject');
//noinspection JSUnresolvedFunction
const map = require('./map.json');

/**
 * @author Paul Okeke
 * Created by paulex on 8/22/17.
 * @name Note
 */
class Upload extends DomainObject {

    constructor(data) {
        super(data, map);
        /*PLEASE DON'T PUT instance fields here that are not mapped to DB*/
    }

    required() {
        return [
            'file_name',
            'file_size',
            'file_path',
            'status',
            'upload_type'
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
            // file_name: String,
            // file_size: Number,
            // file_path: String,
            // status: Number,
            upload_type: 'string|required',
            group_id: 'numeric|required',
            assigned_to: 'numeric|required'
        };
    }
}

//noinspection JSUnresolvedVariable
module.exports = Upload;