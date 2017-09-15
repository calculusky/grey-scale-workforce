const DomainFactory = require('../../../DomainFactory');
const MapperFactory = require('../../../MapperFactory');
const Password = require('../../../../core/Utility/Password');
const Util = require('../../../../core/Utility/MapperUtil');
const Utils = require('../../../../core/Utility/Utils');
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
                                return resolve(Utils.buildResponse({data: {items: result.records}}));
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
     * @param files
     * @param API
     */
    uploadFile(body = {}, who = {}, files = [], API) {
        console.log(body);
        const Upload = DomainFactory.build(DomainFactory.UPLOAD);
        // let upload = new Upload(body);
        const upload_type = body.upload_type;
        if (!upload_type) return Promise.reject(Utils.buildResponse({
            status: "fail",
            data: {message: "Upload type missing."}
        }, 400));
        if (!files.length)return Promise.reject(Utils.buildResponse({
            status: "fail",
            data: {message: "File missing."}
        }, 400));
        const UploadMapper = MapperFactory.build(MapperFactory.UPLOAD);
        const executor = (resolve, reject)=> {
            let processed = 0;
            let rowLen = files.length;
            let uploads = [];
            files.forEach(file=> {
                let upload = new Upload({
                    file_name: file.filename,
                    file_size: file.size,
                    file_path: file.path,
                    file_type: file.mimetype,
                    status: 1,
                    upload_type,
                    created_at: Utils.date.dateToMysql(new Date(), "YYYY-MM-DD H:m:s"),
                    updated_at: Utils.date.dateToMysql(new Date(), "YYYY-MM-DD H:m:s")
                });
                //Get Mapper
                UploadMapper.createDomainRecord(upload).then(upload=> {
                    if (upload) {
                        delete upload.file_path;
                        uploads.push(upload);
                    }
                    if (++processed == rowLen) {
                        console.log("DONE UPLOADING");
                        return resolve(Utils.buildResponse({data: {"items": uploads}}));
                    }
                }).catch(err=> {
                    console.log(err);
                    return reject(err);
                });
            });
        };
        return new Promise(executor);
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
                return Utils.buildResponse({status: "fail", data: {message: "The specified record doesn't exist"}});
            }
            return Utils.buildResponse({data: {by, message: "Upload deleted"}});
        });
    }
}

module.exports = UploadService;