const DomainFactory = require('../../../DomainFactory');
let MapperFactory = null;
const Utils = require('../../../../core/Utility/Utils');
const NetworkUtils = require('../../../../core/Utility/NetworkUtils');
const validate = require('validatorjs');
const request = require('request');
const {flatten} = require("lodash");
const Error = require('../../../../core/Utility/ErrorUtils')();

/**
 * @author Paul Okeke
 * @name NotificationService
 * Created by paulex on 9/5/17.
 */
class NotificationService {

    constructor(context) {
        this.context = context;
        MapperFactory = this.context.modelMappers;
    }

    /**
     * Creates a new notification.
     *
     * @param body {Object}
     * @param who {Session}
     * @returns {*}
     */
    createNotification(body, who) {
        const NotificationMapper = MapperFactory.build(MapperFactory.NOTIFICATION);
        const Notification = DomainFactory.build(DomainFactory.NOTIFICATION);
        const notification = new Notification(body);

        if (!notification.validate()) return Promise.reject(Error.ValidationFailure(notification.getErrors().all()));

        return NotificationMapper.createDomainRecord(notification, who).then(notification => {
            if (!notification) return Promise.reject(notification);
            return Utils.buildResponse({data: notification});
        });
    }

    /**
     * Retrieves notifications
     *
     * @param value {String|Number}
     * @param by {String}
     * @param who {Session}
     * @param offset {Number}
     * @param limit {Number}
     * @returns {Promise<{data?: *, code?: *}>}
     */
    async getNotifications(value, by = "to", who = {}, offset = 0, limit = 10) {
        const NotificationMapper = MapperFactory.build(MapperFactory.NOTIFICATION);
        const {records: notifications} = await NotificationMapper.findDomainRecord(
            {by, value}, offset, limit, "created_at", "desc"
        );

        for (let notification of notifications) {
            const fromUser = await notification.fromUser();
            //the below code uses destructuring and IIFE to retrieve the values needed
            notification.from = (
                ({id, username, first_name, last_name}) => ({id, username, first_name, last_name})
            )(fromUser.records.shift() || {});
        }
        return Utils.buildResponse({data: {items: notifications}});
    }

    /**
     * Updates notification
     *
     * Note: This function is mostly used to update the status of a notification.
     * e.g updating that a notification has been read/seen.
     *
     * @since v2.0.0-alpha02 To update multiple notifications use {@link NotificationService#updateMultipleNotifications}
     *
     * @param value {Number|String}
     * @param by {String}
     * @param body {Object}
     * @param who {Session}
     * @param API {API}
     * @returns {Promise<{data?: *, code?: *}>}
     */
    async updateNotification(value, by = "id", body = {}, who, API) {
        const NotificationMapper = MapperFactory.build(MapperFactory.NOTIFICATION);
        const Notification = DomainFactory.build(DomainFactory.NOTIFICATION);
        const bulk = body['bulk'];

        if (bulk && Array.isArray(bulk)) {
            const promises = [], errors = [];
            for (let item of bulk) {
                const notification = new Notification(item);
                const validator = new validate(notification, {"id": "required|integer"});
                if (validator.passes()) {
                    promises.push(NotificationMapper.updateDomainRecord({
                        by,
                        value: notification.id,
                        domain: notification
                    }, who));
                } else errors.push(validator.errors.first('id'))
            }
            const [...updates] = await Promise.all(promises);
            return Utils.buildResponse({data: {items: updates.map(i => i.shift()), errors}});
        }

        const notification = new Notification(body);
        const [domain, updated] = await NotificationMapper.updateDomainRecord({by, value, domain: notification}, who);

        if (!updated) return Promise.reject(Error.RecordNotFound());

        return Utils.buildResponse({data: domain});
    }

    /**
     * Update multiple notifications
     *
     * Body should contain notification ids and the corresponding object that will be used to update
     * e.g {
     *     1:{status:1},
     *     2:{status:2}
     * }
     * Iterates through each object item and calls {@link NotificationService#updateNotification}
     * The response code of each update operation is returned to the client
     *
     * @param body {Object}
     * @param who {Session}
     * @param API {API}
     * @returns {Promise<{data?: *, code?: *}>}
     */
    async updateMultipleNotifications(body, who, API) {
        const ids = Object.keys(body), response = [];
        for (let id of ids) {
            const update = await this.updateNotification(id, 'id', body[id], who, API).catch(e => !response.push(e.code));
            if (update) response.push(200);
        }
        return Utils.buildResponse({data: response});
    }

    /**
     *
     * @param body {Object}
     * @param who {Session}
     * @param API {API}
     */
    async sendNotification(body = {}, who, API) {
        const Notification = DomainFactory.build(DomainFactory.NOTIFICATION);
        const NotificationMapper = MapperFactory.build(MapperFactory.NOTIFICATION);
        const notification = new Notification(body);
        const db = this.context.db();

        if (!notification.validate()) return Promise.reject(Error.ValidationFailure(notification.getErrors().all()));

        let userIds = [];
        //The to column is an array
        if (notification.to instanceof Array) {
            userIds = [...new Set(notification.to)];
            notification.to = JSON.stringify(userIds);
        } else {
            notification.to = `[${notification.to}]`;
        }
        //TODO we only have this here currently because group:column can't be null
        notification.group = "[]";
        notification.record_ids = notification.record_ids || '[]';

        if (userIds.length === 0) return Promise.resolve(Utils.buildResponse({data: {message: "Nothing to do"}}));

        const fcmTokens = await db.select(['fire_base_token']).from('users').whereIn('id', userIds);
        const payload = notification.buildCloudNotification(flatten(fcmTokens.map(({fire_base_token}) => fire_base_token)));

        if (payload.registration_ids.length) this.push(payload, API).catch(console.error);
        else return Promise.reject(Error.DeviceNotRegistered);

        return NotificationMapper.createDomainRecord(notification, who).then(n => Utils.buildResponse({data: n}));
    }

    /**
     * @param by {String}
     * @param value {String|Number}
     * @returns {*}
     */
    deleteNotification(by = "id", value) {
        const NotificationMapper = MapperFactory.build(MapperFactory.NOTIFICATION);
        return NotificationMapper.deleteDomainRecord({by, value}).then(count => {
            if (!count) return Promise.reject(Error.RecordNotFound());
            return Utils.buildResponse({data: {by, message: "Notification deleted"}});
        });
    }

    /**
     *
     * @param payload
     * @param API {API}
     * @param retrying
     * @returns {Promise}
     */
    push(payload, API, retrying = false) {
        const SEVER_KEY = process.env.FSM_SERVER_KEY;
        let fcmHeader = {"Content-Type": "application/json", "Authorization": "Key=" + SEVER_KEY};
        let rOptions = {headers: fcmHeader, url: "https://fcm.googleapis.com/fcm/send", json: payload};

        const executor = (resolve, reject) => {
            request.post(rOptions, (err, response, body) => {
                if (err) {
                    console.log('FCM:', err);
                    return;
                }
                if (body.failure === 0 && body['canonical_ids'] === 0) return resolve(true); //everything was successful
                let results = body.results;
                results.forEach((err, index) => {
                    if (err['message_id']) {
                        //lets get the registrationId
                        if (err['registration_id']) {
                            //update the old registration id
                            let oldReg = (payload.registration_ids) ? payload.registration_ids[index] : payload.to;
                            //Update the Old Token
                            API.users().unRegisterFcmToken(oldReg, err['registration_id']).catch(console.error);
                            if (retrying) return resolve();
                        }
                    } else {
                        //There must have been an ERROR
                        if (err.error === "Unavailable") {
                            if (!retrying) {
                                NetworkUtils.exponentialBackOff(this.push({
                                    data: payload.data,
                                    to: (payload.registration_ids) ? payload.registration_ids[index] : payload.to
                                }, API, true), 20, 0);
                            } else {
                                return reject(false);
                            }
                        } else if (err.error === "InvalidRegistration") {
                            //Really there is nothing we can do now
                            console.log("InvalidRegistration:", (payload.registration_ids) ? payload.registration_ids[index] : payload.to);
                            if (retrying) return resolve();
                        } else if (err.error === "NotRegistered") {
                            let oldReg = (payload.registration_ids) ? payload.registration_ids[index] : payload.to;
                            API.users().unRegisterFcmToken(oldReg).catch(console.error);
                            if (retrying) return resolve();
                        }
                    }
                });
            });
        };
        return new Promise(executor);
    }
}


module.exports = NotificationService;