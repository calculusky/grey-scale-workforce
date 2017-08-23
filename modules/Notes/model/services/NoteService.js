const DomainFactory = require('../../../DomainFactory');
const MapperFactory = require('../../../MapperFactory');
const Password = require('../../../../core/Utility/Password');
const Util = require('../../../../core/Utility/MapperUtil');
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
        if (!value || "" + value + "".trim() == '') {
            //Its important that all queries are streamlined to majorly for each business
            value = who.api;
            by = "api_instance_id";
        } else if (value) {
            const temp = value;
            value = {};
            value[by] = temp;
            value['module'] = module;
            value['api_instance_id'] = who.api;
            by = "*_and";
        }
        const NoteMapper = MapperFactory.build(MapperFactory.NOTE);
        var executor = (resolve, reject)=> {
            NoteMapper.findDomainRecord({by, value}, offset, limit)
                .then(result=> {
                    let notes = result.records;
                    let processed = 0;
                    let rowLen = notes.length;
                    notes.forEach(note=> {
                        note.user().then(res=> {
                            note.user = res.records.shift();
                            delete note.user.password;
                            if (++processed == rowLen)
                                return resolve(Util.buildResponse({data: {items: result.records}}));
                        }).catch(err=> {
                            return reject(err)
                        })
                    })
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
        let staff = new Note(body);

        //Get Mapper
        const NoteMapper = MapperFactory.build(MapperFactory.NOTE);
        return NoteMapper.createDomainRecord(staff).then(staff=> {
            if (!staff) return Promise.reject();
            return Util.buildResponse({data: staff});
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