const ApiService = require('../../../ApiService');
const DomainFactory = require('../../../DomainFactory');
let MapperFactory = null;
const fs = require("fs");
const Utils = require('../../../../core/Utility/Utils');
const UploadDataTable = require('../commons/UploadDataTable');
const Error = require('../../../../core/Utility/ErrorUtils')();


/**
 * @name UploadService
 * Created by paulex on 8/22/17.
 */
class UploadService extends ApiService {

    constructor(context) {
        super(context);
        MapperFactory = this.context.modelMappers;
    }

    /**
     *
     * @param query {Object}
     * @param who {Session}
     * @return {Promise<{data?: *, code?: *}>}
     */
    async getUploads(query={}, who) {
        const records = await this.buildQuery(query).catch(err => {
            return Promise.reject(Utils.buildResponse(Utils.getMysqlError(err), 400));
        });
        const Upload = DomainFactory.build(DomainFactory.UPLOAD);
        const uploads = records.map(record => new Upload(record));
        return Utils.buildResponse({data: {items: uploads}});
    }

    /**
     *
     * @param body {Object}
     * @param who {Session}
     * @param files {Array}
     * @param API {API}
     */
    uploadFile(body = {}, who, API, files = []) {
        const Upload = DomainFactory.build(DomainFactory.UPLOAD);
        const UploadMapper = MapperFactory.build(MapperFactory.UPLOAD);
        const upload = new Upload(body);

        ApiService.insertPermissionRights(upload, who);

        if (!upload.validate()) return Promise.reject(Error.ValidationFailure(upload.getErrors().all()));
        if (!files.length) return Promise.reject(Error.FormRecordNotFound("files"));

        const uploads = files.map(file => new Upload({
            file_name: file.filename,
            original_file_name: `${Date.now()}_${file.originalname}`,
            file_size: file.size,
            file_path: file.path,
            file_type: file.mimetype,
            status: 1,
            upload_type: upload.upload_type,
            group_id: upload.group_id,
            assigned_to: upload.assigned_to,
            created_by: upload.created_by,
            created_at: Utils.date.dateToMysql(),
            updated_at: Utils.date.dateToMysql()
        }));

        return UploadMapper.createDomainRecord(null, uploads, who).then(items => {
            return (files.length) ? Utils.buildResponse({data: {items}}) : Utils.buildResponse({data: items});
        }).catch(err => {
            files.forEach(file => fs.unlink(file.path));
            console.log(err);
            return err;
        });
    }

    /**
     * For getting dataTable records
     *
     * @param body {Object}
     * @param who {Session}
     * @returns {Promise<IDtResponse>}
     */
    async getUploadDataTableRecords(body, who) {
        const UploadMapper = MapperFactory.build(MapperFactory.UPLOAD);
        const uploadDataTable = new UploadDataTable(this.context.database, UploadMapper, who);
        const editor = await uploadDataTable.addBody(body).make();
        return editor.data();
    }

    /**
     *
     * @param by {String}
     * @param value {String|Number}
     * @param who {Session}
     * @returns {*}
     */
    deleteUpload(by = "id", value, who = {}) {
        const UploadMapper = MapperFactory.build(MapperFactory.UPLOAD);
        return UploadMapper.deleteDomainRecord({by, value}, true, who).then(count => {
            if (!count) return Promise.reject(Error.RecordNotFound());
            return Utils.buildResponse({data: {by, message: "Upload deleted"}});
        });
    }

    /**
     *
     * @param query {Object}
     * @return {*}
     */
    buildQuery(query={}){
        if (typeof query !== 'object') throw new TypeError("Query parameter must be an object");

        const {id, status, offset=0, limit=10} = query;
        const resultSet = this.context.db().select(['*']).from("uploads");

        if(id) resultSet.where('id', id);
        if (status) resultSet.whereIn('start_date', `${status}`.split(","));

        resultSet.where('deleted_at', null).limit(Number(limit)).offset(Number(offset)).orderBy("id", "desc");

        return resultSet;
    }

}

module.exports = UploadService;