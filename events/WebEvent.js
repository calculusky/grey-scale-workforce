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
     * @param note
     * @param who
     */
    async onNotesAdded(note, who) {
        const db = this.context.database;

        let [record, user] = await Promise.all([
            db.table(note.module).where('id', note.relation_id).select(['id', 'assigned_to']),
            db.table("users").where('id', who.sub).select(['id', 'username', 'first_name', 'last_name'])
        ]);

        if (!record.length) return;

        user = user.shift();

        let assignedTo = record.shift();
        assignedTo = ((assignedTo['assigned_to'])) ? assignedTo['assigned_to'] : [];

        let userIds = assignedTo.map(({id}) => id);


        if (!userIds.length) return;
        //Remove the user that added this note from the list of users
        userIds = userIds.filter(id => id !== note.created_by);

        let fromName = `${user.first_name + ' ' + user.last_name}`.replace(/\b\w/g, w => w.toUpperCase());
        const notification = {
            type: "note_added",
            title: `Note from ${fromName}`.ellipsize(30),
            message: note.note.ellipsize(70),
            to: `[${userIds.join(',')}]`,
            group: '[]',
            level: 3
        };

        //Create the notification on the database!.
        this.api.notifications()
            .createNotification(Object.assign({from: who.sub}, notification))
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
    }

    async onUploadComplete(type, status, fileName, createdBy, level = 3) {
        if (!createdBy) return;
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
        if (!socketIds || socketIds.length < 1) return;
        socketIds.forEach(socketId => {
            const socket = this.io.sockets.connected[socketId];
            if (socket) socket.emit('upload_complete', notification);
        });
    }
}

module.exports = new WebEvent();