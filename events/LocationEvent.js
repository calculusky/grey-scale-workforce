/**
 * Created by paulex on 10/31/17.
 */
const EventEmitter = require('events').EventEmitter;
const TAG = "LocationEvent";

class LocationEvent extends EventEmitter {

    constructor() {
        super();
        this.on('update_location', this.onLocationUpdate);
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

    async onLocationUpdate(data, soc, who){
        const uCols = ['id', 'username', 'first_name', 'last_name', 'gender', 'avatar'];
        const db = this.context.db();
        const userId = this.sharedData.clients[soc.id];
        const broadcastMsg = {};
        broadcastMsg.locations = data.locations;

        const mLocation = data.locations[0];

        if ((mLocation.lat < -90 || mLocation.lat > 90) || (mLocation.lon < -180 || mLocation.lon > 180)) {
            console.log("Invalid latitude and longitude entered");
            return false;
        }

        const location = {
            module: "users",
            relation_id: userId,
            location: {
                x: mLocation.lat,
                y: mLocation.lon
            }
        };
        const room_name = `location_update_${userId}`;
        const roomDetails = this.io.sockets.adapter.rooms[room_name];

        if (roomDetails && roomDetails.length > 0) {
            const user = (await db.table("users").where("id", userId).select(uCols)).shift();

            if(!user) {
                console.log(TAG, "User doesn't exist.");
                return false;
            }

            this.api.locations().createLocationHistory(location, who).catch(error => {
                console.log("Error Saving LocationHistory", error);
            });

            Object.assign(broadcastMsg, user);

            const last_work_order = await db.table('work_orders').where(db.raw(`JSON_CONTAINS(assigned_to, '{"id" : ${user.id}}')`)).orderBy('id', 'desc').limit(5).select([
                'id',
                'work_order_no'
            ]);
            const {data: {data: {items}}} = await this.api.attachments().getAttachments(user.id, "notes", "created_by", who, 0, 900);

            broadcastMsg.attachements = items.map(attachment => {
                delete attachment.user;
                return attachment;
            });
            broadcastMsg.last_work_order = last_work_order;
            this.broadcastLocation(`location_update_${user.id}`,'location_update', broadcastMsg);
        }
        return true;
    }

    /**
     *
     * @param to
     * @param key
     * @param data
     */
    broadcastLocation(to, key, data) {
        this.io.to(to).emit(key, data);
    }
}

module.exports = new LocationEvent();

