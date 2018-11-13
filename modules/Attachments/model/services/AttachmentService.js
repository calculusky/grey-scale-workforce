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
    async getAttachments(value, module, by = "id", who = {api: -1}, offset = 0, limit = 10) {
        value = {[by]: value, "module": module};
        const AttachmentMapper = MapperFactory.build(MapperFactory.ATTACHMENT);
        const attachments = (await AttachmentMapper.findDomainRecord({by, value}, offset, limit, 'created_at', 'desc')).records;
        for(let attachment of attachments){
            attachment.user = (await attachment.user()).records.shift() || {};
            if(attachment.location){
                attachment.location.address = await Utils.getAddressFromPoint(attachment.location.x, attachment.location.y).catch(console.error);
            }
        }
        return Utils.buildResponse({data: {items: attachments}});
    }

    /**
     *
     * @param body
     * @param files
     * @param who
     * @param API
     */
    async createAttachment(body = {}, who = {}, files = [], API) {
        const Attachment = DomainFactory.build(DomainFactory.ATTACHMENT);

        const [isValid, location] = (body.location) ? Utils.isJson(body.location) : [false, null];
        const aLocation = (isValid) ? this.context.database.raw(`POINT(${location.x}, ${location.y})`) : null;

        let attachments = [];
        if (files.length) {
            files.forEach(file => attachments.push(new Attachment({
                module: `${body.module}`,
                relation_id: `${body.relation_id}`,
                file_name: file.filename,
                file_size: file.size || 1,
                file_path: file.path,
                file_type: file.mimetype,
                location: aLocation,
                created_by: who.sub,
                group_id: (who.group.length) ? who.group.shift() : null
            })));
        } else {
            body['created_by'] = who.sub;
            body['group_id'] = who.group;
            body['location'] = aLocation;
            attachments.push(new Attachment(body));
        }

        if(location){
            location.address = await Utils.getAddressFromPoint(location.x, location.y).catch(console.error);
        }

        //Get Mapper
        const AttachmentMapper = MapperFactory.build(MapperFactory.ATTACHMENT);
        return AttachmentMapper.createDomainRecord(null, attachments).then(attachment => {
            if (!attachment) return Promise.reject(false);

            if(Array.isArray(attachment)) for(let att of attachment) att.location = location;
            else attachment.location = location;
            //reset the attachment location to what it is
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