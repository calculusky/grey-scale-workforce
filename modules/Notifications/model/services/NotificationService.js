const DomainFactory = require('../../../DomainFactory');
let MapperFactory = null;
const Password = require('../../../../core/Utility/Password');
const Utils = require('../../../../core/Utility/Utils');
const NetworkUtils = require('../../../../core/Utility/NetworkUtils');
const validate = require('validate-fields')();
const request = require('request');

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
     *
     * @param value
     * @param by
     * @param who
     * @param offset
     * @param limit
     * @returns {Promise}
     */
    getNotifications(value, by = "to", who = {api: -1}, offset = 0, limit = 10) {
        if (!value || "" + value + "".trim() === '') {
            //Its important that all queries are streamlined to majorly for each business
            value = who.api;
        } else if (value) {
            console.log(value)
        }
        const NotificationMapper = MapperFactory.build(MapperFactory.NOTIFICATION);
        const executor = (resolve, reject) => {
            NotificationMapper.findDomainRecord({by, value}, offset, limit).then(result=> {
                let notifications = result.records;
                return resolve(Utils.buildResponse({data: {items: notifications}}));
            }).catch(err=> {
                return reject(err);
            });
        };

        return new Promise(executor)
    }


    /**
     *
     * @param body
     * @param who
     * @param API {API}
     */
    sendNotification(body = {}, who = {}, API) {
        const Notification = DomainFactory.build(DomainFactory.NOTIFICATION);
        let notification = new Notification(body);
        console.log(notification);
        let isValid = validate(notification.rules(), notification);

        if (!isValid) {
            return Promise.reject(Utils.buildResponse({status: "fail", data: {message: validate.lastError}}, 400));
        }

        let userIds = [];
        //The to column is an array
        if (notification.to instanceof Array) {
            userIds = [...new Set(notification.to)];
            notification.to = JSON.stringify(userIds);
        } else {
            notification.to = `[${notification.to}]`;
        }

        let fcmTokens = [];
        let processed = 0;

        //We need to get the fire-base token of the users in notification.to
        let resultSet = this.context.database.select(['fire_base_token']).from('users');
        userIds.forEach((id, i)=> {
            resultSet = (i === 0) ? resultSet.where('id', id) : resultSet.orWhere('id', id);
            if (++processed === userIds.length) {
                resultSet.then(results=> {
                    fcmTokens = results.reduce((accumulator, cVal)=> {
                        //we should however check if the value is an array to avoid un wanted errors
                        return accumulator['fire_base_token'].concat(cVal['fire_base_token']);
                    }, {"fire_base_token": []});
                    //Now lets do the actual notification
                    let payload = {
                        notification: {
                            'title': 'IE Force',
                            body: notification.message,
                            click_action: "com.mrworking.workorder.MAIN"
                        },
                        data: {
                            type: notification.type
                        },
                        registration_ids: fcmTokens
                    };
                    if (payload.registration_ids.length) return this.push(payload, API);
                    else
                        return Promise.reject(Utils.buildResponse({
                            status: "fail",
                            data: {message: "Device not registered"}
                        }, 400));
                });
            }
        });
        if (userIds.length === 0) {
            return Promise.resolve(Utils.buildResponse({data: {message: "Nothing to do"}}));
        }
        // Get Mapper
        const NotificationMapper = MapperFactory.build(MapperFactory.NOTIFICATION);
        return NotificationMapper.createDomainRecord(notification).then(n => Utils.buildResponse({data: {items: n}}));
    }

    /**
     * @param by
     * @param value
     * @returns {*}
     */
    deleteNotification(by = "id", value) {
        const NotificationMapper = MapperFactory.build(MapperFactory.NOTIFICATION);
        return NotificationMapper.deleteDomainRecord({by, value}).then(count=> {
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
        const SEVER_KEY = "AIzaSyAcsDeik3Pp7chgiUu89xAW26WA_ylDFcY";
        let fcmHeader = {"Content-Type": "application/json", "Authorization": "Key=" + SEVER_KEY};
        let rOptions = {headers: fcmHeader, url: "https://fcm.googleapis.com/fcm/send", json: payload};

        const executor = (resolve, reject) => {
            request.post(rOptions, (err, response, body)=> {
                if (err) {
                    console.log('FCM:', err);
                    return;
                }
                console.log(body);
                if (body.failure === 0 && body['canonical_ids'] === 0) return resolve(true); //everything was successful
                let results = body.results;
                results.forEach((err, index)=> {
                    if (err['message_id']) {
                        //lets get the registrationId
                        if (err['registration_id']) {
                            //update the old registration id
                            let oldReg = (payload.registration_ids) ? payload.registration_ids[index] : payload.to;
                            //Update the Old Token
                            // API.users().updateUser('firebase_token', oldReg, {'firebase_token': err['registration_id']});
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
                            // API.users().updateUser('firebase_token', oldReg, {'firebase_token': ''});
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