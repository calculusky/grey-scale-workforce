const DomainFactory = require('../../../DomainFactory');
const MapperFactory = require('../../../MapperFactory');
const Password = require('../../../../core/Utility/Password');
const Util = require('../../../../core/Utility/MapperUtil');
/**
 * @name UploadService
 * Created by paulex on 8/22/17.
 */
class UploadService {

    constructor(context) {
        this.context = context;
    }

    getName() {
        return "uploadService";
    }

    getUploads(value, module, by = "id", who = {api: -1}, offset = 0, limit = 10) {
        const UploadMapper = MapperFactory.build(MapperFactory.UPLOAD);
        var executor = (resolve, reject)=> {
            UploadMapper.findDomainRecord({by, value}, offset, limit)
                .then(result=> {
                    let uploads = result.records;
                    let processed = 0;
                    let rowLen = uploads.length;
                    uploads.forEach(upload=> {
                        upload.user().then(res=> {
                            upload.user = res.records.shift();
                            delete upload.user.password;
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
    uploadFile(body = {}, who = {}) {
        const Upload = DomainFactory.build(DomainFactory.UPLOAD);
        body['api_instance_id'] = who.api;
        let staff = new Upload(body);

        //Get Mapper
        const UploadMapper = MapperFactory.build(MapperFactory.UPLOAD);
        return UploadMapper.createDomainRecord(staff).then(staff=> {
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
    deleteUpload(by = "id", value) {
        const UploadMapper = MapperFactory.build(MapperFactory.UPLOAD);
        return UploadMapper.deleteDomainRecord({by, value}).then(count=> {
            if (!count) {
                return Util.buildResponse({status: "fail", data: {message: "The specified record doesn't exist"}});
            }
            return Util.buildResponse({data: {by, message: "Upload deleted"}});
        });
    }
}

module.exports = UploadService;