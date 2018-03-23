// const DomainFactory = require('../../../DomainFactory');
// let MapperFactory = null;
const Utils = require('../../../../core/Utility/Utils');
const processes = require('../../../../processes.json');
const ProcessAPI = require('../../../../processes/ProcessAPI');
const PUtils = ProcessAPI.Utils;
const Events = require('../../../../events/events');
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

        ProcessAPI.init({
            "baseUrl": process.env.PM_BASE_URL,
            "clientId": process.env.PM_CLIENT_ID,
            "clientSecret": process.env.PM_CLIENT_SECRET,
            "workSpace": process.env.PM_WORK_SPACE,
            "apiVersion": process.env.PM_API_VERSION
        }).login(this.username, this.password).catch(e => {
            console.log(e);
        });
    }

    /**
     * @param caseId
     * @param variables
     * @param who
     * @returns {Promise<*>}
     */
    static async sendVariables(caseId, variables = {}, who) {
        if (!who['pmToken']) return;
        return ProcessAPI.request(`/cases/${caseId}/variable`, variables, 'PUT', who['pmToken']);
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
        if (!ProcessAPI['token']) await ProcessAPI.login(this.username, this.password);
        const db = this.context.database;
        // //we need to get the updated user record
        let dbUser = await db.table("users").where(by, value).select([
            'username',
            'first_name',
            'last_name',
            'email',
            'mobile_no',
            'wf_user_id'
        ]);

        if (!dbUser.length) return;

        dbUser = dbUser.shift();

        body['wf_user_id'] = dbUser['wf_user_id'];

        if (!body) return;

        let response = null;

        if (body['wf_user_id']) {
            const pmUser = toPMUser(body);
            response = await ProcessAPI.request(`/user/${body['wf_user_id']}`, pmUser, 'PUT').catch(err => {
                console.log("updateUser:", err);
            });
        } else {
            // If this user doesn't have a wf_user_id
            // We can assume that the user doesn't exist
            // Create the user using the username as the default password
            if (body.password) dbUser.password = body.password; else dbUser.password = dbUser.username;
            response = await this.createUser(dbUser);
        }
        return response;
    }

    /**
     * Creates a User on process maker
     *
     * @param body
     * @param who
     * @param retry - determines if this should be retried in-case an error occurs
     */
    async createUser(body = {}, who = {}, retry = true) {
        if (!ProcessAPI['token']) await ProcessAPI.login(this.username, this.password);

        const pUser = toPMUser(body);

        return await ProcessAPI.request('/users', pUser, 'POST').catch(err => {
            //TODO send a formatted error
            return Promise.reject(err);
        });
    }

    /**
     * Remove user from group
     *
     * @param wfUserId
     * @param groupId
     * @returns {Promise<*>}
     */
    async removeUserFromGroup(wfUserId, groupId) {
        if (!ProcessAPI['token']) await ProcessAPI.login(this.username, this.password);

        let group = await this.context.database.table("groups").where("id", groupId).select(['id', 'name', 'wf_group_id']);
        group = group.shift();
        let response = null;
        if (group) {
            if (!group['wf_group_id']) {
                //if the group doesn't exist on process maker lets create it
                const grp = await this.createGroup(group);
                group['wf_group_id'] = grp['grp_uid'];
            }
            response = await ProcessAPI.request(`/group/${group['wf_group_id']}/user/${wfUserId}`, null, 'DELETE')
                .catch(err => {
                    //Error Handler : the user might already be added to the group
                    console.log("removeUserFromGroup:", err);
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
        if (!ProcessAPI['token']) await ProcessAPI.login(this.username, this.password);
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
                    return Promise.resolve(false);
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
        const db = this.context.database;
        //let's check if the group already exist on process maker
        let dbGroup = await db.table("groups").where("id", group.id)
            .select(['id', 'name', 'wf_group_id']);

        dbGroup = dbGroup.shift();

        if (!dbGroup) return;

        let response = null;
        if (dbGroup['wf_group_id']) {
            const pmGroup = {grp_title: dbGroup["name"]};
            response = await ProcessAPI.request(`/group/${dbGroup['wf_group_id']}`, pmGroup, 'PUT').catch(err => {
                console.log('UpdateGroupProcessMaker:', err);
            });
        } else {
            // Should in-case the group doesn't have a wf_case_id
            // We can assume that the group doesn't exist on process maker
            // So we create it on the background
            response = this.createGroup(dbGroup);
        }
        return response;
    }

    async deleteGroup() {

    }

    /**
     *  Adds a user to a group in process maker
     *
     * @param wfUserId - The workflow user id
     * @param groupId
     */
    async addUserToGroup(wfUserId, groupId) {
        if (!ProcessAPI['token']) await ProcessAPI.login(this.username, this.password);

        const db = this.context.database;

        //first let get the wf_group_id of this group
        let group = await db.table("groups").where("id", groupId).select(['id', 'name', 'wf_group_id']);
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
     *
     *
     * @param domain {DomainObject}
     * @param who
     * @param processKey
     * @param tableName - The table name to update with the wf_case_id. If not set the table will not be updated
     * @returns {Promise<void>}
     */
    async startCase(processKey, who, domain, tableName = null) {
        if (!who['pmToken'] && !ProcessAPI['token']) await ProcessAPI.login(this.username, this.password);

        let process = processes[processKey];

        if (!process) return;

        //lets get the wf_user_id of the user
        let user = await this.context.database.table("users").where("id", who.sub).select(['wf_user_id']);

        if (!user.length) return;

        user = user.shift();

        let payload = {};
        if (process['saveAs']) {
            let saveAs = process['saveAs'];
            for (let key in saveAs) {
                if (saveAs.hasOwnProperty(key) && domain.hasOwnProperty(key)) payload[saveAs[key]] = domain[key];
            }
        }

        payload['SUBMITTER'] = user['wf_user_id'];
        payload['dateDue'] = Utils.date.moment(new Date(), "YYYY-MM-DD HH:MM:SS").add(30, 'days');

        payload = PUtils.buildCaseVars(process['processId'], process['taskStartId'], payload);
        let response = await ProcessAPI.request('/cases', payload, 'POST', who['pmToken']).catch(err => {
            console.log(err);
        });

        const caseId = (response) ? response['app_uid'] : null;

        await this.routeCase(caseId, who).catch(err => {
            console.log('ROUTE', err);
        });

        if (tableName && caseId) this.doAssignment(caseId, domain, tableName, who);

        return response;
    }

    /**
     * Routes a case to the next task
     *
     * @param caseId
     * @param who
     * @param data
     * @param delIndex
     * @returns {Promise<*>}
     */
    async routeCase(caseId, who, delIndex = '1', data = {},) {
        if (!who['pmToken']) await ProcessAPI.login(this.username, this.password);//TODO revert
        const routeUrl = `/cases/${caseId}/route-case`;
        data['del_index'] = delIndex;
        return await ProcessAPI.request(routeUrl, data, 'PUT', who['pmToken']);
    }

    /**
     *
     * @param caseId
     * @param comments
     * @param variables
     * @param who
     * @returns {Promise<void>}
     */
    async resume(caseId, comments, variables, who) {
        let $case = await this.getCase(caseId, who);

        const $task = $case['current_task'].shift();

        if (!$task) return Promise.resolve(1);

        const delIndex = $task['del_index'];

        if (comments) {
            //TODO send comments here
        }
        //Send the set variables
        await WorkflowService.sendVariables(caseId, variables, who);

        return this.routeCase(caseId, who, delIndex);
    }

    /**
     *
     * @param caseId
     * @param who
     * @returns {Promise<*>}
     */
    async getCase(caseId, who) {
        if (!who['pmToken'] && !ProcessAPI['token']) await ProcessAPI.login(this.username, this.password);
        let resp = await ProcessAPI.request(`/cases/${caseId}`, null, 'GET', who['pmToken']).catch(err => {
            return err;
        });
        resp = JSON.parse(resp);
        return (!resp.error) ? resp : Promise.reject(Utils.processMakerError(resp));
    }

    doAssignment(caseId, domain, tableName, who) {
        this.context.database.table(tableName).where('id', domain['id'])
            .update({wf_case_id: caseId}).then(r => console.log('UPDATED_CASE_ID', r)).catch(err => console.log(err));

        this.getCase(caseId, who).then(res => {
            const currentTask = res['current_task'];
            const date = Utils.date.dateToMysql(new Date(), 'YYYY-MM-DD H:m:s');
            const db = this.context.database;
            currentTask.forEach(async task => {
                //Now lets assign the record to the user process maker assigned it to
                //Also lets emit an event that a case has been assigned
                let user = await db.table("users").where('wf_user_id', task['usr_uid']).select(['id']);

                if (!user.length) return;

                user = user.shift();

                //lets fetch the record and append the assigned_to
                let assignedTo = await db.table(tableName).where("id", domain['id']).select(['assigned_to']);

                if (!assignedTo.length) return;

                assignedTo = assignedTo.shift();

                if (!assignedTo.assigned_to.find(item => item.id === user.id)) {
                    assignedTo.assigned_to.push({"id": user.id, created_at: date, "for": "approval"});
                }

                Events.emit("payment_plan_assigned", domain.id, [user.id]);

                db.table(tableName).where("id", domain['id'])
                    .update({"assigned_to": JSON.stringify(assignedTo.assigned_to)}).then();
            });
        });
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