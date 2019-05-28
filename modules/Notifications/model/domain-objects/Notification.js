//noinspection JSUnresolvedFunction
const DomainObject = require('../../../../core/model/DomainObject');
//noinspection JSUnresolvedFunction
const map = require('./map.json');

/**
 * @author Paul Okeke
 * Created by paulex on 7/4/17.
 * @name Notification
 */
class Notification extends DomainObject {

    constructor(data) {
        super(data, map);
        /*PLEASE DON'T PUT instance fields here that are not mapped to DB*/
    }

    required() {
        return [
            'type',
            'message',
            'from',
            'to'
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
            type: 'string|required',
            message: 'string|required',
            status: 'numeric',
            from: 'integer|required',
            record_ids: 'string-array',
            to: 'required'
        };
    }

    isAuditAble() {
        return false;
    }

    /**
     *
     * @param registrationIds
     * @param title
     * @returns {{data: {title: string, body: *, type: *}, priority: string, ttl: number, registration_ids: *}}
     */
    buildCloudNotification(registrationIds, title = this.title) {
        return {
            data: {
                title,
                body: this.message,
                type: this.type
            },
            priority: "high",
            ttl: 3600,
            registration_ids: registrationIds
        };
    }

    fromUser() {
        return this.relations().belongsTo("User", "from");
    }
}

//noinspection JSUnresolvedVariable
module.exports = Notification;