const ApiService = require('../../../ApiService');
const DomainFactory = require('../../../DomainFactory');
let MapperFactory = null;
const Utils = require('../../../../core/Utility/Utils');
const validate = require('validate-fields')();
const Events = require('../../../../events/events');

/**
 * @name NoteService
 * Created by paulex on 8/22/17.
 */
class NoteService extends ApiService {

    constructor(context) {
        super(context);
        MapperFactory = this.context.modelMappers;
    }

    getNotes(value, module, by = "id", who = {api: -1}, offset = 0, limit = 10) {
        value = {[by]: value, "module": module};
        const NoteMapper = MapperFactory.build(MapperFactory.NOTE);
        const executor = (resolve, reject) => {
            NoteMapper.findDomainRecord({by, value}, offset, limit)
                .then(results => {
                    let notes = results.records;
                    let processed = 0;
                    let rowLen = notes.length;
                    notes.forEach(note => {
                        const promises = [];
                        promises.push(note.user(), note.attachments());
                        Promise.all(promises).then(values => {
                            note.user = values.shift().records.shift();
                            note.attachments = values.shift().records;
                            sweepNoteResponsePayload(note);
                            if (++processed === rowLen) {
                                console.log(notes[0]['attachments']);
                                return resolve(Utils.buildResponse({data: {items: notes}}));
                            }
                        }).catch(err => {
                            return reject(err);
                        });
                    });
                    if (!rowLen) return resolve(Utils.buildResponse({data: {items: notes}}));
                })
                .catch(err => {
                    return reject(err);
                });
        };
        return new Promise(executor)
    }

    /**
     *
     * @param body
     * @param who
     * @param files
     * @param API {API}
     */
    createNote(body = {}, who = {}, files = [], API) {
        const Note = DomainFactory.build(DomainFactory.NOTE);
        let note = new Note(body);
        note.created_by = who.sub;

        ApiService.insertPermissionRights(note, who);

        let isValid = validate(note.rules(), note);
        if (!isValid) {
            return Promise.reject(Utils.buildResponse({status: "fail", data: {message: validate.lastError}}, 400));
        }
        //Get Mapper
        const NoteMapper = MapperFactory.build(MapperFactory.NOTE);
        return NoteMapper.createDomainRecord(note).then(note => {
            if (!note) return Promise.reject();

            if (files.length) {
                API.attachments().createAttachment({module: "notes", relation_id: note.id}, who, files, API).then();
            }
            //TODO notify those assign to this record that a note is added
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
        delete attachment.module;
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