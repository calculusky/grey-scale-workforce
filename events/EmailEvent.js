/**
 * Created by paulex on 10/31/17.
 */
const EventEmitter = require('events').EventEmitter;
const Email = require('email-templates');
const path = require('path');
const mailer = require('nodemailer');
const Utils = require('../core/Utility/Utils');
const mg = require('nodemailer-mailgun-transport');
const jwt = require('jsonwebtoken');
const ProcessAPI = require('../processes/ProcessAPI');


class EmailEvent extends EventEmitter {

    constructor() {
        super();
        this.email = new Email({
            message: {
                from: process.env.MAIL_FROM || "admin@mrworking.com", // sender address
            },
            views: {root: path.resolve('public/templates/emails')},
            send: true,
            transport: mailer.createTransport(mg({
                "secure": false,
                "auth": {
                    "domain": process.env.MAIL_HOST || "www.google.com",
                    "api_key": process.env.MAIL_PASSWORD || "tst"
                }
            })),
            jsonTransport: true
        });
        //Register events
        this.on('payment_plan_assigned', this.onPaymentPlanAssigned);
        this.on('note_added', this.onNotesAdded);
        this.on('payment_plan_approval', this.onPaymentPlanApproval);
    }

    /**
     * Handles all email success
     * @param data
     */
    static onEmailSuccess(data) {
        console.log('EmailSent:', data);
    }

    static onEmailFail(e) {
        // console.log('EmailFailed:', e);
    }

    /**
     * Initializes the Email Event with necessary inputs
     *
     * @param context {Context}
     * @param io
     * @param API {API}
     * @param sharedData
     */
    init(context, io, API, sharedData) {
        this.context = context;
        this.io = io;
        this.api = API;
        this.sharedData = sharedData;
        return this;
    }

    async onPaymentPlanAssigned(planId, assignedTo) {
        const db = this.context.database;
        let paymentPlan = await db.table("payment_plans").where("id", planId).select(['assigned_to', 'disc_order_id']);

        if (!paymentPlan.length) return;

        const users = await db.table("users").whereIn("id", assignedTo)
            .select(['id', 'email', 'username', 'first_name', 'last_name', 'group_id', 'wf_user_pass']);

        users.forEach(async user => {
            const tokenOpt = {
                sub: user.id,
                aud: `api`,
                exp: Math.floor(Date.now() / 1000) + 10000,
                name: user.username,
                group: user.group_id
            };

            tokenOpt['pmToken'] = await ProcessAPI.login(
                user.username,
                Utils.decrypt(user.wf_user_pass, process.env.JWT_SECRET)
            );

            //Generate a one time token
            let token = jwt.sign(tokenOpt, process.env.JWT_SECRET);
            this.context.persistence.set(token, true, 'EX', 10000);

            this.email.send({
                template: 'payment_plan',
                message: {to: user.email},
                locals: {
                    recipient: `${user.first_name} ${user.last_name}`,
                    link: `${process.env.APP_WEB_URL}/payment-plan-approval/${planId}/${token}`
                }
            }).then(EmailEvent.onEmailSuccess).catch(EmailEvent.onEmailFail);
        });
    }

    /**
     * This event is triggered whenever a note is been added
     *
     * @param note
     * @param who
     * @returns {Promise<void>}
     */
    async onNotesAdded(note, who) {
        //So we are going to send email to all users assigned to the record this note was meant for
        const db = this.context.database;

        const record = await db.table(note.module).where('id', note.relation_id).select(['id', 'assigned_to']);

        if (!record.length) return;

        let assignedTo = record.shift();
        assignedTo = ((assignedTo['assigned_to'])) ? assignedTo['assigned_to'] : [];

        const userIds = assignedTo.map(({id}) => id);

        let users = await db.table("users").whereIn('id', userIds).select(['id', 'email', 'first_name', 'last_name']);

        if (!users.length) return;
        //Remove the user that added this note from the list of users
        users = users.filter(user => user.id !== note.created_by);

        const emails = users.map(({email}) => email);

        this.email.send({
            template: 'note_added',
            message: {to: emails.join(',')},
            locals: {
                module: Utils.getModuleName(note.module),
                note: note.note,
                noteBy: who.name
            }
        }).then(EmailEvent.onEmailSuccess).catch(EmailEvent.onEmailFail);
    }

    /**
     * Handles events when a payment plan is received
     *
     * @param planId
     * @param who
     * @param approval
     * @returns {Promise<void>|*}
     */
    async onPaymentPlanApproval(planId, who, approval = true) {
        const db = this.context.database;
        //We only send notification to the user than created it and users assigned to it
        let plan = await db.table("payment_plans").where("id", planId).select(['assigned_to', 'created_by']);
        //[{created_by:1, assigned_to:[{}]}]
        plan = plan.shift();

        if (!plan) return;

        let assignedTo = ((plan['assigned_to'])) ? plan['assigned_to'] : [];

        const userIds = assignedTo.map(({id}) => id);

        if (!userIds.includes(plan['created_by']) && plan['created_by']) userIds.push(plan['created_by']);

        let users = await db.table("users").whereIn('id', userIds).select(['id', 'email', 'first_name', 'last_name']);

        if (!users.length) return;
        //Remove the user that added this note from the list of users
        users = users.filter(user => user.id !== who.sub);

        const emails = users.map(({email}) => email);

        this.email.send({
            template: 'payment_plan_approval',
            message: {to: emails.join(',')},
            locals: {
                link: `${process.env.APP_WEB_URL}/payment-plan/${planId}`,
                approval
            }
        }).then(EmailEvent.onEmailSuccess).catch(EmailEvent.onEmailFail);
    }
}

module.exports = new EmailEvent();