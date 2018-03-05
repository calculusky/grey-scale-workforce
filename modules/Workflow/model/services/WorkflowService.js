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

        const pUser = toPMUser(body);

        const response = await ProcessAPI.request('/users', pUser, 'POST').catch(err => {
            //First we should notify the dev team about the error

            //If there persist a network error we are going to do a retry
            //However we should resolve the promise to the primary callee and internally handle the process

            if (err.error.code !== 400 && retry /*TODO properly check if the error is worth a retry*/) {
                NetworkUtils.exponentialBackOff(this.createUser(body, who, false), 10, 0);
                return Promise.resolve('retrying');
            }
            //TODO if the user already exist then let's update the user usr_uid with the user
            return Promise.reject(err);
        });

        //Now lets update the user record with the wf_user_id
        if (response && response['USR_UID']) {
            //Updates the users table with the process maker user id
            this.context.database.table("users").where("users.id", body.id).update({wf_user_id: response['USR_UID']})
                .then().catch();

            //If the group_id is specified while creating this user, add the user to the group in process maker as well
            if (body.group_id) this.addUserToGroup(response['USR_UID'], body.group_id).then();
        }
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
    async updateUser(by, value, body = {}) {
        if (!ProcessAPI['token']) await ProcessAPI.login("admin@nogic.org", "admin");

        //we need to get the updated user record
        let dbUser = await  this.context.database.table("users").where(by, value).select();
        dbUser = dbUser.shift();

        if (!dbUser) return;

        let response = null;

        if (dbUser['wf_user_id']) {
            delete  dbUser.password;
            const pmUser = toPMUser(dbUser);
            response = await ProcessAPI.request(`/user/${dbUser['wf_user_id']}`, pmUser, 'PUT').catch(err => {
                console.log("updateUser:", err);
            });

            //TODO should in-case the user group_id has changed, lets update the user group

        } else {
            console.log("creating this user on process maker because it doesn't have a wf_user_id");
            dbUser.password = dbUser.username;//default password
            response = await this.createUser(dbUser);
        }
        return response;
    }

    /**
     *  Adds a user to a group in process maker
     *
     * @param wfUserId - The workflow user id
     * @param groupId
     */
    async addUserToGroup(wfUserId, groupId) {
        //first let get the wf_group_id of this group
        let group = await this.context.database.table("groups").where("id", groupId).select(['id', 'wf_group_id']);
        group = group.shift();
        let response = null;
        if (group) {
            if (!group['wf_group_id']) {
                //if the group doesn't exist on process maker lets create it
                const grp = await this.createGroup(group);
                group['wf_group_id'] = grp['grp_uid'];
            }
            response = await ProcessAPI.request(`/group/${group['wf_group_id']}/user`, {usr_uid: wfUserId}, 'POST')
                .catch(err => {
                    //Error Handler : the user might already be added to the group
                    console.log("addUserToGroup:", err);
                });
        }
        return response;
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
            //No matter what happens we can assume this was successful except a network issue
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

    /**
     * Create a group on process maker
     *
     * @param group
     * @returns {Promise<void>}
     */
    async createGroup(group = {}) {
        if (!ProcessAPI['token']) await ProcessAPI.login(this.username, this.password);
        const response = await ProcessAPI.request('/group', {grp_title: group.name, grp_status: 'ACTIVE'}, 'POST')
            .catch(err => {
                if (err.error.code === 400) {
                    console.log("Group already exist on process maker");
                    //TODO we can quickly fetch the grp_uid and resolve
                    return Promise.resolve();
                }
                return Promise.reject(err);
            });
        if (response && response['grp_uid']) {
            //update the table
            this.context.database.table("groups").where("id", group.id).update({wf_group_id: response['grp_uid']})
                .then().catch();
        }
        return response;
    }


    /**
     * Update a group on process maker
     *
     * @param group
     * @returns {Promise<*>}
     */
    async updateGroup(group) {
        if (!ProcessAPI['token']) await ProcessAPI.login(this.username, this.password);
        //let's check if the group already exist on process maker
        let dbGroup = await this.context.database.table("groups").where("id", group.id)
            .select(['id', 'name', 'wf_group_id']);

        dbGroup = dbGroup.shift();

        if (!dbGroup) return;

        let response = null;
        console.log("WfGroup", dbGroup);
        if (dbGroup['wf_group_id']) {
            const pmGroup = {grp_title: dbGroup["name"]};
            response = await ProcessAPI.request(`/group/${dbGroup['wf_group_id']}`, pmGroup, 'PUT').catch(err => {
                console.log('UpdateGroupProcessMaker:', err);
            });
        } else {
            //If this dbGroup doesn't have a wf_group_id: lets create the group on process maker
            response = this.createGroup(dbGroup);
        }
        console.log(response);
        return response;
    }

    async deleteGroup() {

    }
}

function toPMUser(body) {
    const newBody = {
        usr_username: body.username,
        usr_firstname: body.first_name,
        usr_lastname: body.last_name,
        usr_email: body.email,
        usr_due_date: '2023-12-31',
        usr_status: 'ACTIVE',
        usr_role: 'PROCESSMAKER_OPERATOR',
        usr_phone: body.mobile_no || ""
    };
    if (body.password) {
        newBody['usr_new_pass'] = body.password;
        newBody['usr_cnf_pass'] = body.password;
    }
    return newBody;
}

module.exports = WorkflowService;