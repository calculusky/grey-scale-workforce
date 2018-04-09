/**
 * Created by paulex on 10/31/17.
 */
const EventEmitter = require('events').EventEmitter;
const moment = require("moment");
const request = require('request');

class LocationEvent extends EventEmitter {

    constructor() {
        super();
        this.on('update_location', this.broadcastLocation);
    }

    /**
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
    }

    async broadcastLocation(data, soc) {
        const db = this.context.database;
        const userId = this.sharedData.clients[soc.id];
        const broadcastMsg = {};
        let user = await db.table("users").where("id", userId).select([
            'id',
            'username',
            'first_name',
            'last_name',
            'avatar'
        ]);

        if (!user.length) return;

        user = user.shift();

        broadcastMsg.user = user;

        /*---------------------------------------------
        | Get the dates we would be querying in between
        ----------------------------------------------*/
        const endDate = moment().format('YYYY-MM-DD');
        const startDate = moment().subtract(2, "days").format("YYYY-MM-DD");

        const [totalWO, todayCompleted, scheduledToday, openWO] = await Promise.all([
            db.table("work_orders").count("id as count").whereRaw(`JSON_CONTAINS(assigned_to, '{"id":${user.id}}')`),
            db.table("work_orders").whereRaw(`JSON_CONTAINS(assigned_to, '{"id":${user.id}}')`
                + `and DATE(completed_date) = CURDATE()`)
                .select(['id', 'related_to', 'type_id', db.raw('DATE_FORMAT(completed_date, \'%Y-%m-%d\') ')]),
            db.table("work_orders").whereRaw(`JSON_CONTAINS(assigned_to, '{"id":${user.id}}')`
                + `and DATE(start_date) = CURDATE()`)
                .select(['id', 'related_to', 'type_id', db.raw('DATE_FORMAT(start_date, \'%Y-%m-%d\')')]),
            this.api.workOrders().getWorkOrdersBetweenDates(user.id, null, startDate, endDate, 0, 10)
        ]);


        broadcastMsg.total_work_orders = totalWO.shift().count;

        /*----------------------------------------------------------
        | Work Orders with type_id:1 are disconnections work order |
        | Work Orders with type_id:2 are reconnection work order   |
        -----------------------------------------------------------*/
        broadcastMsg.work_orders_completed_today = {
            total: todayCompleted.length,
            disconnections: todayCompleted.filter(({related_to, type_id}) => {
                return related_to.toLowerCase() === "disconnection_billings" && type_id === 1;
            }).length,
            reconnections: todayCompleted.filter(({related_to, type_id}) => {
                return related_to.toLowerCase() === "disconnection_billings" && type_id === 2;
            }).length,
            faults: todayCompleted.filter(({related_to}) => related_to.toLowerCase() === "faults").length
        };

        broadcastMsg.work_orders_scheduled_today = {
            total: scheduledToday.length,
            disconnections: scheduledToday.filter(({related_to, type_id}) => {
                return related_to.toLowerCase() === "disconnection_billings" && type_id === 1;
            }).length,
            reconnections: scheduledToday.filter(({related_to, type_id}) => {
                return related_to.toLowerCase() === "disconnection_billings" && type_id === 2;
            }).length,
            faults: scheduledToday.filter(({related_to}) => related_to.toLowerCase() === "faults").length
        };

        broadcastMsg.work_orders = openWO.data.data.items;
        /*
         * We need to do a reverse geo-coding on the customer address
         * to provide a destination as longitude and latitude to the consumer
         */
        const geocodeEnpoint = 'https://maps.googleapis.com/maps/api/geocode/json?address=';
        let processed = 0;
        broadcastMsg.work_orders.forEach(item => {
            if (!item.customer || !item.customer.plain_address) return;
            delete item.payment_plan;
            const url = `${geocodeEnpoint}${item.customer.plain_address}&key${process.env.GOOGLE_API_KEY}`;
            request(url, (err, res, body) => {
                if (err) return;

                body = JSON.parse(body);
                const reversed = body.results.shift();

                item.destination = {
                    location: (reversed) ? reversed.geometry.location : {},
                    formatted_address: (reversed) ? reversed.formatted_address : ""
                };

                if (++processed === broadcastMsg.work_orders.length) {
                    // console.log(JSON.stringify(broadcastMsg));
                    soc.broadcast.emit("update_location", broadcastMsg);
                }
            });
        });
        broadcastMsg.locations = data.locations;
        if (broadcastMsg.work_orders.length === 0) soc.broadcast.emit("update_location", broadcastMsg);
    }
}

module.exports = new LocationEvent();

