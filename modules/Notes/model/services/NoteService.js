const DomainFactory = require('../../../DomainFactory');
const MapperFactory = require('../../../MapperFactory');
const Password = require('../../../../core/Utility/Password');
const Util = require('../../../../core/Utility/MapperUtil');
const validate = require('validate-fields')();
/**
 * @name NoteService
 * Created by paulex on 8/22/17.
 */
class NoteService {

    constructor() {

    }

    getName() {
        return "noteService";
    }

    getNotes(value, module, by = "id", who = {api: -1}, offset = 0, limit = 10) {
        value = {[by]: value, "module": module};
        console.log(value);
        const NoteMapper = MapperFactory.build(MapperFactory.NOTE);
        var executor = (resolve, reject)=> {
            NoteMapper.findDomainRecord({by, value}, offset, limit)
                .then(results=> {
                    let notes = results.records;
                    let processed = 0;
                    let rowLen = notes.length;
                    notes.forEach(note=> {
                        note.user().then(res=> {
                            note.user = res.records.shift();
                            delete note.user.password;
                            delete note.user.permissions;
                            delete note.user.firebase_token;
                            delete note.user.location;
                            delete note.user.middle_name;
                            delete note.source;
                            delete note.source_id;
                            delete note.source_name;
                            if (++processed == rowLen)
                                return resolve(Util.buildResponse({data: {items: notes}}));
                        }).catch(err=> {
                            return reject(err)
                        })
                    });
                    if (!rowLen) return resolve(Util.buildResponse({data: {items: notes}}));
                })
                .catch(err=> {
                    return reject(err);
                });
        };
        return new Promise(executor)
    }

    /**
     *
     * @param body
     * @param who
     */
    createNote(body = {}, who = {}) {
        const Note = DomainFactory.build(DomainFactory.NOTE);
        body['api_instance_id'] = who.api;
        console.log(who);
        let note = new Note(body);
        note.note_by = who.sub;
        let isValid = validate(note.rules(), note);
        if (!isValid) {
            return Promise.reject(Util.buildResponse({status: "fail", data: {message: validate.lastError}}, 400));
        }
        //Get Mapper
        const NoteMapper = MapperFactory.build(MapperFactory.NOTE);
        return NoteMapper.createDomainRecord(note).then(note=> {
            if (!note) return Promise.reject();
            return Util.buildResponse({data: note});
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
        return NoteMapper.deleteDomainRecord({by, value}).then(count=> {
            if (!count) {
                return Util.buildResponse({status: "fail", data: {message: "The specified record doesn't exist"}});
            }
            return Util.buildResponse({data: {by, message: "Note deleted"}});
        });
    }
}

module.exports = NoteService;