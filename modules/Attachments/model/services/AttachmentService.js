const ApiService = require('../../../ApiService');
const DomainFactory = require('../../../DomainFactory');
let MapperFactory = null;
const Utils = require('../../../../core/Utility/Utils');
const Error = require('../../../../core/Utility/ErrorUtils')();

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
     * @param who {Session}
     * @param offset
     * @param limit
     * @returns {Promise}
     */
    async getAttachments(value, module, by = "id", who, offset = 0, limit = 10) {
        value = {[by]: value};
        if (module) value.module = module;
        const AttachmentMapper = MapperFactory.build(MapperFactory.ATTACHMENT);
        const attachments = (await AttachmentMapper.findDomainRecord({
            by,
            value
        }, offset, limit, 'created_at', 'desc')).records;
        for (let attachment of attachments) {
            attachment.user = (await attachment.user()).records.shift() || {};
            attachment.getPublicUrl();
            delete attachment.file_path;
            if (attachment.location) {
                attachment.location.address = await Utils.getAddressFromPoint(attachment.location.x, attachment.location.y).catch(console.error);
            }
        }
        return Utils.buildResponse({data: {items: attachments}});
    }

    /**
     *
     * @param body {Object}
     * @param files {Array}
     * @param who {Session}
     * @param API {API}
     */
    async createAttachment(body = {}, who, files = [], API) {
        const authUser = who.getAuthUser();
        const Attachment = DomainFactory.build(DomainFactory.ATTACHMENT);

        const [isValid, location] = (body.location) ? Utils.isJson(body.location) : [false, null];
        const aLocation = (isValid) ? this.context.db().raw(`POINT(${location.x}, ${location.y})`) : null;

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
                created_by: authUser.getUserId(),
                group_id: authUser.getGroups().shift() || null
            })));
        } else {
            body['created_by'] = authUser.getUserId();
            body['group_id'] = authUser.getGroups().shift() || 1;
            body['location'] = aLocation;
            const attachment = new Attachment(body);
            if (!attachment.validate()) return Promise.reject(Error.ValidationFailure(attachment.getErrors().all()));
            attachments.push(attachment);
        }

        if (location) {
            location.address = await Utils.getAddressFromPoint(location.x, location.y).catch(console.error);
        }

        //Get Mapper
        const AttachmentMapper = MapperFactory.build(MapperFactory.ATTACHMENT);
        return AttachmentMapper.createDomainRecord(null, attachments, who).then(attachment => {
            if (!attachment) return Promise.reject(false);

            if (Array.isArray(attachment)) for (let att of attachment) att.location = location;
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
     * @deprecated
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
     * @param who {Session}
     * @returns {*}
     */
    deleteAttachment(by = "id", value, module, who) {
        value = {[by]: value, module};
        const AttachmentMapper = MapperFactory.build(MapperFactory.ATTACHMENT);
        return AttachmentMapper.deleteDomainRecord({value}, true, who).then(count => {
            if (!count) return Promise.reject(Error.RecordNotFound());
            return Utils.buildResponse({data: {message: "Attachment deleted"}});
        });
    }
}

module.exports = AttachmentService;