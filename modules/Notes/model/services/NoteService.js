const ApiService = require('../../../ApiService');
const DomainFactory = require('../../../DomainFactory');
let MapperFactory = null;
const Events = require('../../../../events/events');
const Error = require('../../../../core/Utility/ErrorUtils')();
const {getAddressFromPoint, buildResponse, convertLocationToPoints} = require('../../../../core/Utility/Utils');

/**
 * @name NoteService
 * Created by paulex on 8/22/17.
 */
class NoteService extends ApiService {

    constructor(context) {
        super(context);
        MapperFactory = this.context.modelMappers;
    }

    /**
     *
     * @param val {String|Number}
     * @param module {String}
     * @param who {Session}
     * @param by {String}
     * @param offset {Number}
     * @param limit {Number}
     * @return {Promise<{data?: *, code?: *}>}
     */
    async getNotes(val, module, who, by = "id", offset = 0, limit = 10) {
        const value = {[by]: val, module};
        const NoteMapper = MapperFactory.build(MapperFactory.NOTE);
        const notes = (await NoteMapper.findDomainRecord({by, value}, offset, limit)).records;
        for (const note of notes) {
            const [{records: [user]}, {records: attachments}] = await Promise.all([note.user(), note.attachments()]);
            note.user = user;
            note.attachments = attachments;
            if (note.location) {
                note.location.address = await getAddressFromPoint(note.location.x, note.location.y).catch(console.error);
            }
            sweepNoteResponsePayload(note);
        }
        return buildResponse({data: {items: notes}});
    }

    /**
     *
     * @param body {Object}
     * @param who {Session}
     * @param files {Array}
     * @param API {API}
     */
    async createNote(body = {}, who, API, files = []) {
        const NoteMapper = MapperFactory.build(MapperFactory.NOTE);
        const Note = DomainFactory.build(DomainFactory.NOTE);
        const note = new Note(body);
        let location = null;

        ApiService.insertPermissionRights(note, who);

        if (!note.validate()) return Promise.reject(Error.ValidationFailure(note.getErrors().all()));

        ({point: note.location, location} = await convertLocationToPoints(this.context.db(), body));

        return NoteMapper.createDomainRecord(note, who).then(note => {
            if (!note) return Promise.reject(Error.InternalServerError);
            note.location = location;
            onNoteAdded(note, who, API, files);
            return buildResponse({data: note});
        });
    }

    /**
     *
     * @param by {String}
     * @param value {String|Number}
     * @returns {*}
     */
    deleteNote(by = "id", value) {
        const NoteMapper = MapperFactory.build(MapperFactory.NOTE);
        return NoteMapper.deleteDomainRecord({by, value}).then(count => {
            if (!count) return Promise.reject(Error.RecordNotFound());
            return buildResponse({data: {by, message: "Note deleted"}});
        });
    }
}

/**
 *
 * @param note {Object}
 * @param who {Session}
 * @param API {API}
 * @param files {Array}
 */
function onNoteAdded(note, who, API, files) {
    if (files.length) {
        API.attachments().createAttachment({module: "notes", relation_id: note.id, location}, who, files, API).then();
    }
    Events.emit("note_added", note, who);
}


function sweepNoteResponsePayload(note) {
    note.attachments.forEach(attachment => {
        delete attachment.created_by;
        delete attachment.deleted_at;
        delete attachment.updated_at;
        delete attachment.created_at;
        delete attachment.details;
        delete attachment.relation_id;
    });
    delete note.source;
    delete note.source_id;
    delete note.source_name;
}

module.exports = NoteService;