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
            'gender',
            'avatar'
        ]);
        user = user.shift();

        let last_work_order = await db.table('work_orders').where(db.raw(`JSON_CONTAINS(assigned_to, '{"id" : ${user.id}}')`)).orderBy('id', 'desc').limit(1).select([
            'id',
            'work_order_no'
        ]);

        last_work_order = last_work_order.shift();

        Object.assign(broadcastMsg, user);

        const records = await this.api.attachments().getAttachments(user.id, "notes", "created_by");

        let attachments = records.data.data.items.map(attachment => {
            delete attachment.user;
            return attachment;
        });
        const mLocation = data.locations.shift();

        broadcastMsg.locations = data.locations;
        broadcastMsg.attachements = attachments;
        broadcastMsg.last_work_order = last_work_order;

        if ((mLocation.lat < -90 || mLocation.lat > 90) || (mLocation.lon < -180 || mLocation.lon > 180)) {
            console.log("Invalid latitude and longitude entered");
            return;
        }

        const location = {
            module: "users",
            relation_id: `${user.id}`,
            location: {
                x: mLocation.lat,
                y: mLocation.lon
            }
        };

        this.api.locations().createLocationHistory(location).then(response => {
            // console.log("Saved Location History", response);
        }).catch(error => {
            console.log("Error Saving LocationHistory",error);
        });


        this.io.to(`location_update_${user.id}`).emit('location_update', broadcastMsg);

        return true;
    }
}

module.exports = new LocationEvent();

