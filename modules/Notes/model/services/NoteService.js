const ApiService = require('../../../ApiService');
const DomainFactory = require('../../../DomainFactory');
let MapperFactory = null;
const Utils = require('../../../../core/Utility/Utils');
const validate = require('validatorjs');
const Events = require('../../../../events/events');
const Error = require('../../../../core/Utility/ErrorUtils')();

/**
 * @name NoteService
 * Created by paulex on 8/22/17.
 */
class NoteService extends ApiService {

    constructor(context) {
        super(context);
        MapperFactory = this.context.modelMappers;
    }

    async getNotes(value, module, by = "id", who = {api: -1}, offset = 0, limit = 10) {
        value = {[by]: value, "module": module};
        const NoteMapper = MapperFactory.build(MapperFactory.NOTE);
        const notes = (await NoteMapper.findDomainRecord({by, value}, offset, limit)).records;
        for(const note of notes){
            const [{records:[user]}, {records:attachments}] = await Promise.all([note.user(), note.attachments()]);
            note.user = user;
            note.attachments = attachments;
            if(note.location){
                note.location.address = await Utils.getAddressFromPoint(note.location.x, note.location.y).catch(console.error);
            }
            sweepNoteResponsePayload(note);
        }
        return Utils.buildResponse({data: {items: notes}});
    }

    /**
     *
     * @param body
     * @param who
     * @param files
     * @param API {API}
     */
    async createNote(body = {}, who = {}, files = [], API) {
        const Note = DomainFactory.build(DomainFactory.NOTE);
        const [isValid, location] = (body.location) ? Utils.isJson(body.location) : [false, null];
        const aLocation = (isValid) ? this.context.database.raw(`POINT(${location.x}, ${location.y})`) : null;

        let note = new Note(body);
        note.created_by = who.sub;
        note.location = aLocation;

        ApiService.insertPermissionRights(note, who);

        let validator = new validate(note, note.rules(), note.customErrorMessages());

        if (validator.fails()) return Promise.reject(Error.ValidationFailure(validator.errors.all()));

        if(location){
            location.address = await Utils.getAddressFromPoint(location.x, location.y).catch(console.error);
        }

        //Get Mapper
        const NoteMapper = MapperFactory.build(MapperFactory.NOTE);
        return NoteMapper.createDomainRecord(note).then(note => {
            if (!note) return Promise.reject(false);
            note.location = location;
            if (files.length) {
                API.attachments().createAttachment({module: "notes", relation_id: note.id, location}, who, files, API).then();
            }

            Events.emit("note_added", note, who);
            return Utils.buildResponse({data: note});
        });
    }

    /**
     *
     * @param by
     * @param value
     * @returns {*}
     */
    deleteNote(by = "id", value) {
        const NoteMapper = MapperFactory.build(MapperFactory.NOTE);
        return NoteMapper.deleteDomainRecord({by, value}).then(count => {
            if (!count) {
                return Utils.buildResponse({status: "fail", data: {message: "The specified record doesn't exist"}});
            }
            return Utils.buildResponse({data: {by, message: "Note deleted"}});
        });
    }
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
    if (note.user) {
        delete note.user.password;
        delete note.user.permissions;
        delete note.user.group_id;
        delete note.user.assigned_to;
        delete note.user.created_by;
        delete note.user.address_id;
        delete note.user.last_login;
        delete note.user.firebase_token;
        delete note.user.location;
        delete note.user.middle_name;
        delete note.user.created_at;
        delete note.user.updated_at;
    }
    delete note.source;
    delete note.source_id;
    delete note.source_name;
}

module.exports = NoteService;