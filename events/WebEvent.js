const EventEmitter = require('events').EventEmitter;
const _ = require('lodash');

class WebEvent extends EventEmitter {

    constructor() {
        super();
        this.on("note_added", this.onNotesAdded);
        this.on("upload_completed", this.onUploadComplete);
    }

    /**
     * Initializes the Web Event with necessary inputs
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

    /**
     * This events is fired when a new note is added
     *
     * @param note {Note|Object}
     * @param note.module {String}
     * @param note.note {String}
     * @param note.relation_id {String}
     * @param who {Session}
     * @return Promise<Boolean>
     */
    async onNotesAdded(note, who) {
        if (!note.relation_id || !note.module || !note.note)
            throw new TypeError("relation_id, module and note must be set in note");

        const db = this.context.db();

        let [record, user] = await Promise.all([
            db.table(note.module).where('id', note.relation_id).select(['id', 'assigned_to']),
            db.table("users").where('id', who.getAuthUser().getUserId()).select(['id', 'username', 'first_name', 'last_name'])
        ]);

        if (!record.length || !user.length) return false;

        user = user.shift();

        let assignedTo = record.shift();
        assignedTo = ((assignedTo['assigned_to'])) ? assignedTo['assigned_to'] : [];

        let userIds = assignedTo.map(({id}) => id);


        if (!userIds.length) return false;
        //Remove the user that added this note from the list of users
        userIds = userIds.filter(id => id !== note.created_by);

        let fromName = `${user.first_name + ' ' + user.last_name}`.replace(/\b\w/g, w => w.toUpperCase());
        const notification = {
            type: "note_added",
            title: `Note from ${fromName}`.ellipsize(30),
            message: note.note.ellipsize(70),
            to: `[${userIds.join(',')}]`,
            record_ids:`[${note.id}]`,
            group: '[]',
            level: 3
        };

        //Create the notification on the database!.
        this.api.notifications()
            .createNotification(Object.assign({from: who.getAuthUser().getUserId()}, notification), who)
            .catch(console.error);

        notification.from = user;
        userIds.forEach(userId => {
            const socketIds = this.sharedData.clients[userId];
            if (!socketIds || socketIds.length < 1) return;
            socketIds.forEach(socketId => {
                const socket = this.io.sockets.connected[socketId];
                if (socket) socket.emit('note_added', notification);
            });
        });
        return true;
    }

    /**
     *
     * @param type
     * @param status - The status of the upload that determines if it the upload completed or it failed
     * @param fileName
     * @param createdBy
     * @param level
     * @returns {Promise<Boolean>}
     */
    async onUploadComplete(type, status, fileName, createdBy, level = 3) {
        if (!createdBy) return false;
        //now we need to notify this guy who uploaded the record
        const notification = {
            type: "upload_complete",
            title: `Upload Complete`,
            message: `The ${type} record you uploaded is done processing.`,
            to: `[${createdBy}]`,
            from: 1,
            group: '[]',
            level
        };

        const socketIds = this.sharedData.clients[createdBy];
        if (!socketIds || socketIds.length < 1) return false;
        socketIds.forEach(socketId => {
            const socket = this.io.sockets.connected[socketId];
            if (socket) socket.emit('upload_complete', notification);
        });
        return true;
    }
}

module.exports = new WebEvent();