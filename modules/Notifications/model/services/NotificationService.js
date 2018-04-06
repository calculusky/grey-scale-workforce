const DomainFactory = require('../../../DomainFactory');
let MapperFactory = null;
const Password = require('../../../../core/Utility/Password');
const Utils = require('../../../../core/Utility/Utils');
const NetworkUtils = require('../../../../core/Utility/NetworkUtils');
const validate = require('validatorjs');
const request = require('request');
const _ = require("lodash");

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


    createNotification(body) {
        const Notification = DomainFactory.build(DomainFactory.NOTIFICATION);
        let notification = new Notification(body);
        const validator = new validate(notification, notification.rules(), notification.customErrorMessages());

        if (validator.fails()) {
            return Promise.reject(Utils.buildResponse({
                status: "fail",
                data: validator.errors.all(),
                code: 'VALIDATION_ERROR'
            }, 400));
        }

        //Get Mapper
        const NotificationMapper = MapperFactory.build(MapperFactory.NOTIFICATION);
        return NotificationMapper.createDomainRecord(notification).then(notification => {
            if (!notification) return Promise.reject(notification);
            return Utils.buildResponse({data: notification});
        });
    }

    /**
     *
     * @param value
     * @param by
     * @param who
     * @param offset
     * @param limit
     * @returns {Promise}
     */
    async getNotifications(value, by = "to", who = {}, offset = 0, limit = 10) {
        const NotificationMapper = MapperFactory.build(MapperFactory.NOTIFICATION);
        const {records: notifications} = await NotificationMapper.findDomainRecord({by, value}, offset, limit);

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
     *
     * @param body
     * @param who
     * @param API {API}
     */
    async sendNotification(body = {}, who = {}, API) {
        const Notification = DomainFactory.build(DomainFactory.NOTIFICATION);
        const NotificationMapper = MapperFactory.build(MapperFactory.NOTIFICATION);
        const db = this.context.database;
        const notification = new Notification(body);
        const validator = new validate(notification, notification.rules(), notification.customErrorMessages());

        if (validator.fails()) {
            return Promise.reject(Utils.buildResponse({
                status: "fail",
                data: validator.errors.all(),
                code: 'VALIDATION_ERROR'
            }, 400));
        }

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

        if (userIds.length === 0) return Promise.resolve(Utils.buildResponse({data: {message: "Nothing to do"}}));

        const fcmTokens = await db.select(['fire_base_token']).from('users').whereIn('id', userIds);

        let payload = {
            notification: {
                'title': 'IE Force',
                body: notification.message,
                click_action: "com.mrworking.workorder.MAIN"
            },
            data: {
                type: notification.type
            },
            registration_ids: _.flatten(fcmTokens.map(({fire_base_token}) => fire_base_token))
        };
        if (payload.registration_ids.length) this.push(payload, API).catch(console.error);
        else return Promise.reject(Utils.buildResponse({
            status: "fail",
            data: {message: "Device not registered"}
        }, 400));

        return NotificationMapper.createDomainRecord(notification).then(n => Utils.buildResponse({data: {items: n}}));
    }

    /**
     * @param by
     * @param value
     * @returns {*}
     */
    deleteNotification(by = "id", value) {
        const NotificationMapper = MapperFactory.build(MapperFactory.NOTIFICATION);
        return NotificationMapper.deleteDomainRecord({by, value}).then(count => {
            if (!count) {
                return Utils.buildResponse({status: "fail", data: {message: "The specified record doesn't exist"}});
            }
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
                console.log(body);
                if (body.failure === 0 && body['canonical_ids'] === 0) return resolve(true); //everything was successful
                let results = body.results;
                results.forEach((err, index) => {
                    if (err['message_id']) {
                        //lets get the registrationId
                        if (err['registration_id']) {
                            //update the old registration id
                            let oldReg = (payload.registration_ids) ? payload.registration_ids[index] : payload.to;
                            //Update the Old Token
                            API.users().unRegisterFcmToken(oldReg, err['registration_id']);
                            if (retrying) return resolve();
                        }
                    } else {
                        //There must have been an ERROR
                        if (err.error === "Unavailable") {
                            if (!retrying) {
                                NetworkUtils.exponentialBackOff(this.push({
                                    notification: payload.notification,
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
                            API.users().unRegisterFcmToken(oldReg);
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