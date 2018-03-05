// const DomainFactory = require('../../../DomainFactory');
// let MapperFactory = null;
const Utils = require('../../../../core/Utility/Utils');
const processes = require('../../../../processes.json');
const ProcessAPI = require('../../../../processes/ProcessAPI');
const PUtils = ProcessAPI.Utils;
const NetworkUtils = require('../../../../core/Utility/NetworkUtils');

/**
 * Created by paulex on 02/27/18.
 */

/**
 * @name WorkflowService
 */
class WorkflowService {

    constructor(context) {
        this.context = context;
        /*TODO username and password should be put in a secret file e.g .env*/
        this.username = "admin@nogic.org";
        this.password = "admin";
        ProcessAPI.init(context.config.processMaker).login(this.username, this.password).catch(e => {
            console.log(e);
            //If we can't reach process maker, let's end the application process
            process.exit(1);
        });
    }


    /**
     * Creates a User on process maker
     *
     * @param body
     * @param who
     * @param retry - determines if this should be retried in-case an error occurs
     */
    async createUser(body = {}, who = {}, retry = true) {
        if (!ProcessAPI['token']) await ProcessAPI.login("admin@nogic.org", "admin");

        const pUser = {
            usr_username: body.username,
            usr_firstname: body.first_name,
            usr_lastname: body.last_name,
            usr_email: body.email,
            usr_due_date: '2023-12-31',
            usr_status: 'ACTIVE',
            usr_role: 'PROCESSMAKER_OPERATOR',
            usr_new_pass: body.password,
            usr_cnf_pass: body.password,
            usr_phone: body.mobile_no
        };

        const response = await ProcessAPI.request('/users', pUser, 'POST').catch(err => {
            //First we should notify the dev team about the error

            //If there persist a network error we are going to do a retry
            //However we should resolve the promise to the primary callee and internally handle the process

            if (retry /*TODO check if the error is worth a retry*/) {
                NetworkUtils.exponentialBackOff(this.createUser(body, who, false), 10, 0);
                return Promise.resolve('retrying');
            }
            //TODO if the user already exist then let's update the user usr_uid with the user
            return Promise.reject(err);
        });

        //Now lets update the user record with the wf_user_id
        if (response['USR_UID'])
            await this.context.database.table("users").where("users.id", body.id).update({
                wf_user_id: response['USR_UID']
            });

        return response;
    }

    /**
     * Updates a user on process maker
     *
     * @param by
     * @param value
     * @param body
     * @returns {Promise.<User>|*}
     */
    updateUser(by, value, body = {}) {

    }

    /**
     * Deletes a user on process maker
     *
     * @returns {*}
     */
    async deleteUser(user, retry = true) {
        if (!ProcessAPI['token']) await ProcessAPI.login("admin@nogic.org", "admin");
        return await ProcessAPI.request(`/user/${user.wf_user_id}`, null, 'DELETE').catch(err => {
            console.log(err);
            //Now matter what happens we can assume this was successful except a network issue
            if (retry && err/*Error is a network error*/) {
                //NetworkUtils.exponentialBackOff(this.deleteUser(user, false), 10, 0);
                //return Promise.resolve('retrying');
            }
            return (err['error']) ? Promise.resolve(true) : Promise.reject(err);
        });
    }


    async getUsers(filter) {
        if (!ProcessAPI['token']) await ProcessAPI.login("admin@nogic.org", "admin");
        let endPoint = `/users?start=0&limit=10${(filter) ? "&filter=" + filter : ""}`;
        return await ProcessAPI.request(endPoint, null, 'GET').catch(err => {
            console.log(err);
        });
    }

    createGroup() {

    }

    async updateGroup() {

    }

    async deleteGroup() {

    }

    addUserToGroup() {

    }
}

module.exports = WorkflowService;