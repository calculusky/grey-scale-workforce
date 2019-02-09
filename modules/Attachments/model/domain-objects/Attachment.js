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

    toAuditAbleFormat(context) {
        if (this.location) this.location = this.location.sql;
        return this;
    }

    rules() {
        return {
            relation_id: 'integer|required',
            module: 'string|required',
            file_path: 'string|required',
            file_type: 'string|required',
            file_size:'string|required'
        };
    }

    getPublicUrl(){
        this.file_url = `${process.env.APP_URL}:${process.env.PORT}/attachment/${this.module}/download/${this.file_name}`;
        return this.file_url;
    }

    user(cols = ["id", "username", "first_name", "last_name"]) {
        return this.relations().belongsTo("User", "created_by", cols);
    }
}

//noinspection JSUnresolvedVariable
module.exports = Attachment;