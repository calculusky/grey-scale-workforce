const ApiService = require('../../../ApiService');
const DomainFactory = require('../../../DomainFactory');
let MapperFactory = null;
const Password = require('../../../../core/Utility/Password');
const Util = require('../../../../core/Utility/MapperUtil');
const fs = require("fs");
const Utils = require('../../../../core/Utility/Utils');
const validate = require('validatorjs');

/**
 * @name UploadService
 * Created by paulex on 8/22/17.
 */
class UploadService extends ApiService {

    constructor(context) {
        super(context);
        MapperFactory = this.context.modelMappers;
    }

    getName() {
        return "uploadService";
    }

    getUploads(value, module, by = "id", who = {api: -1}, offset = 0, limit = 10) {
        const UploadMapper = MapperFactory.build(MapperFactory.UPLOAD);
        const executor = (resolve, reject) => {
            UploadMapper.findDomainRecord({by, value}, offset, limit)
                .then(result => {
                    let uploads = result.records;
                    let processed = 0;
                    let rowLen = uploads.length;
                    uploads.forEach(upload => {
                        upload.user().then(res => {
                            upload.user = res.records.shift();
                            delete upload.user.password;
                            if (++processed === rowLen)
                                return resolve(Utils.buildResponse({data: {items: result.records}}));
                        }).catch(err => {
                            return reject(err)
                        })
                    })
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
     * @param API
     */
    uploadFile(body = {}, who = {}, files = [], API) {
        const Upload = DomainFactory.build(DomainFactory.UPLOAD);
        const uploadObj = new Upload(body);

        ApiService.insertPermissionRights(uploadObj, who);

        //Enforce validation
        let validator = new validate(uploadObj, uploadObj.rules(), uploadObj.customErrorMessages());
        if (validator.fails()) {
            //immediately delete the uploaded file
            files.forEach(file => fs.unlink(file.path));
            return Promise.reject(Utils.buildResponse({
                status: "fail",
                data: validator.errors.all(),
                code: 'VALIDATION_ERROR'
            }, 400));
        }
        console.log(uploadObj);

        if (!files.length) return Promise.reject(Utils.buildResponse({
            status: "fail",
            data: {message: "File missing."}
        }, 400));

        const UploadMapper = MapperFactory.build(MapperFactory.UPLOAD);
        const executor = (resolve, reject) => {
            let processed = 0;
            let rowLen = files.length;
            let uploads = [];
            files.forEach(file => {
                let upload = new Upload({
                    file_name: file.filename,
                    original_file_name: `${Date.now()}_${file.originalname}`,
                    file_size: file.size,
                    file_path: file.path,
                    file_type: file.mimetype,
                    status: 1,
                    upload_type: uploadObj.upload_type,
                    group_id: uploadObj.group_id,
                    assigned_to: uploadObj.assigned_to,//JSON.stringify()`[{"id":${uploadObj.assigned_to}, "created_at":"${Utils.date.dateToMysql(new Date(), "YYYY-MM-DD H:m:s")}"}]`,
                    created_by: uploadObj.created_by,
                    created_at: Utils.date.dateToMysql(),
                    updated_at: Utils.date.dateToMysql()
                });
                //Get Mapper
                UploadMapper.createDomainRecord(upload).then(upload => {
                    if (upload) (delete upload.file_path) && uploads.push(upload);
                    if (++processed === rowLen) return resolve(Utils.buildResponse({data: {"items": uploads}}));
                }).catch(err => {
                    files.forEach(file => fs.unlink(file.path));
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
     * @param who
     * @returns {*}
     */
    deleteUpload(by = "id", value, who={}) {
        const UploadMapper = MapperFactory.build(MapperFactory.UPLOAD);
        return UploadMapper.deleteDomainRecord({by, value}, true, who).then(count => {
            if (!count) {
                return Utils.buildResponse({status: "fail", data: {message: "The specified record doesn't exist"}});
            }
            return Utils.buildResponse({data: {by, message: "Upload deleted"}});
        });
    }
}

module.exports = UploadService;