/**
 * Created by paulex on 10/31/17.
 */
const EventEmitter = require('events').EventEmitter;
const mailer = require('nodemailer');
const emailConfig = require('../config').email;
const mg = require('nodemailer-mailgun-transport');


class EmailEvent extends EventEmitter {

    constructor() {
        super();

        this.transporter = mailer.createTransport(mg(emailConfig));

        // const mailData = {
        //     from: 'bwahab@vasconsolutions.com', // sender address
        //     to: 'donpaul120@gmail.com', // list of receivers
        //     subject: 'Great News', // Subject line
        //     text: 'Never say never?', // plain text body
        //     html: '<b>Something Happened?</b>' // html body
        // };
        //
        // this.transporter.sendMail(mailData, (err, info) => {
        //     if (err) return console.log(err);
        //     console.log(info);
        // });

        this.on('payment_plan_assigned', this.assignPaymentPlan);
    }

    /**
     *
     * @param context {Context}
     * @param io
     * @param API {API}
     */
    init(context, io, API) {
        this.context = context;
        this.io = io;
        this.api = API;
        this.name = "Paul Okeke";
    }

    async assignPaymentPlan(planId) {
        //get the paymentPlan
        let paymentPlan = await this.context.database.table("payment_plans")
            .where("id", planId).select(['assigned_to', 'disc_order_id']);
        //We'd have to parse the assigned_to and get the user:id

        console.log(paymentPlan);
    }
}

module.exports = new EmailEvent();