const EventEmitter = require('events').EventEmitter;

class WebEvent extends EventEmitter {

    constructor() {
        super();
        this.on("note_added", this.onNotesAdded);
    }

    /**
     * Initializes the Web Event with necessary inputs
     * @param context {Context}
     * @param io
     * @param API {API}
     */
    init(context, io, API) {
        this.context = context;
        this.io = io;
        this.api = API;
        this.name = "Paul Okeke";
        return this;
    }

    /**
     *
     * @param note
     * @param who
     */
    onNotesAdded(note, who) {
        console.log('sent socket io event to the web');
    }
}

module.exports = new WebEvent();