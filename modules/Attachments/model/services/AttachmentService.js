const ApiService = require('../../../ApiService');
const DomainFactory = require('../../../DomainFactory');
let MapperFactory = null;
const Utils = require('../../../../core/Utility/Utils');

/**
 * @name AttachmentService
 * Created by paulex on 8/22/17.
 */
class AttachmentService extends ApiService {

    constructor(context) {
        super(context);
        MapperFactory = this.context.modelMappers;
    }

    /**
     *
     * @param value
     * @param module
     * @param by
     * @param who
     * @param offset
     * @param limit
     * @returns {Promise}
     */
    getAttachments(value, module, by = "id", who = {api: -1}, offset = 0, limit = 10) {
        value = {[by]: value, "module": module};
        const AttachmentMapper = MapperFactory.build(MapperFactory.ATTACHMENT);
        const executor = (resolve, reject) => {
            AttachmentMapper.findDomainRecord({by, value}, offset, limit, 'created_at', 'desc')
                .then(result => {
                    let attachments = result.records;
                    let processed = 0;
                    let rowLen = attachments.length;
                    attachments.forEach(attachment => {
                        attachment.user().then(res => {
                            attachment.user = res.records.shift() || {};
                            if (attachment.user) {
                                delete attachment.user.password;
                                delete attachment.user.permissions;
                                delete attachment.user.firebase_token;
                                delete attachment.user.location;
                                delete attachment.user.middle_name;
                                delete attachment.user.email;
                                delete attachment.user.created_at;
                                delete attachment.user.updated_at;
                            }
                            if (++processed === rowLen)
                                return resolve(Utils.buildResponse({data: {items: result.records}}));
                        }).catch(err => {
                            return reject(err)
                        })
                    });
                    if (!rowLen) return resolve(Utils.buildResponse({data: {items: attachments}}));
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
     * @param files
     * @param who
     * @param API
     */
    createAttachment(body = {}, who = {}, files = [], API) {
        const Attachment = DomainFactory.build(DomainFactory.ATTACHMENT);
        let attachments = [];
        if (files.length) {
            files.forEach(file => attachments.push(new Attachment({
                module: `${body.module}`,
                relation_id: `${body.relation_id}`,
                file_name: file.filename,
                file_size: file.size || 1,
                file_path: file.path,
                file_type: file.mimetype,
                created_by: who.sub,
                group_id: (who.group.length) ? who.group.shift() : null
            })));
        } else {
            body['created_by'] = who.sub;
            body['group_id'] = who.group;
            attachments.push(new Attachment(body));
        }
        //Get Mapper
        const AttachmentMapper = MapperFactory.build(MapperFactory.ATTACHMENT);
        return AttachmentMapper.createDomainRecord(null, attachments).then(attachment => {
            if (!attachment) return Promise.reject(false);
            return Utils.buildResponse({data: Array.isArray(attachment) ? attachment.pop() : attachment});
        });
    }

    /**
     *
     * @param body
     * @param who
     * @param files
     * @param API
     */
    addIncomingAttachments(body = {}, who = {}, files = [], API) {
        const Attachment = DomainFactory.build(DomainFactory.ATTACHMENT);
        //for incoming request , the module name and request-id is required and there must be a file
        if (!body.module || !body['request_id'] || files.length === 0) {
            return Promise.reject(Utils.buildResponse({
                status: "fail",
                data: {message: 'Nothing to do'}
            }, 400));

        }
        let requestId = body['request_id'];

        if (!this.context.getIncoming(requestId)) {
            console.log("Not Request ID found");
            return Promise.reject(Utils.buildResponse({
                status: "fail",
                data: {message: 'Request ID Not Found'}
            }, 404));
        }

        let attachments = [];

        if (files.length) files.forEach(file => attachments.push(new Attachment({
            module: `${body.module}`,
            relation_id: `${this.context.getIncoming(requestId)}`,
            file_name: file.filename,
            file_size: file.size,
            file_path: file.path,
            file_type: file.mimetype,
            created_by: who.sub,
            group_id: who.group
        })));

        let executor = (resolve, reject) => {
            let processed = 0;
            let rowLen = attachments.length;
            let attachmentIds = [];
            //TODO: Do a multiple insert here rather than call a for-loop
            attachments.forEach(attachment => {
                this.createAttachment(attachment, who).then(response => {
                    if (++processed === rowLen) {
                        attachmentIds.push(response.data.data.id);
                        this.context.deleteIncoming(requestId);
                        return resolve(Utils.buildResponse({data: true}));
                    }
                }).catch(err => {
                    console.log(err);
                    return reject(err);
                });
            });
        };
        return new Promise(executor);
    }

    /**
     * Used for downloading the attachment file
     * @param module
     * @param fileName
     * @param who
     * @param res
     */
    fetchAttachedFile(module, fileName, who, res) {
        let rootPath = this.context.config.storage;
        let modulePath = rootPath.routeStorage[module];
        if (!modulePath) {
            return res.sendStatus(404);//return an error
        }
        let storagePath = "";
        if (modulePath.use_parent) {
            storagePath = `${modulePath.path}`;
        }
        return res.sendFile(`${storagePath}/${fileName}`, {root: rootPath.path});
    }

    /**
     *
     * @param by
     * @param value
     * @param module
     * @returns {*}
     */
    deleteAttachment(by = "id", value, module) {
        value = {[by]: value, module};
        const AttachmentMapper = MapperFactory.build(MapperFactory.ATTACHMENT);
        return AttachmentMapper.deleteDomainRecord({value}).then(count => {
            if (!count) {
                return Promise.reject(Utils.buildResponse({
                    status: "fail",
                    data: {message: "The specified record doesn't exist"}
                }));
            }
            return Utils.buildResponse({data: {[by]: value, message: "Attachment deleted"}});
        });
    }
}

module.exports = AttachmentService;