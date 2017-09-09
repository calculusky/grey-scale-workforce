const DomainFactory = require('../../../DomainFactory');
const MapperFactory = require('../../../MapperFactory');
const Password = require('../../../../core/Utility/Password');
const Util = require('../../../../core/Utility/MapperUtil');
/**
 * @name AttachmentService
 * Created by paulex on 8/22/17.
 */
class AttachmentService {

    constructor(context) {
        this.context = context;
    }

    getName() {
        return "attachmentService";
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
        if (!value || "" + value + "".trim() == '') {
            //Its important that all queries are streamlined to majorly for each business
            value = who.api;
            by = "api_instance_id";
        } else if (value) {
            value = {[by]: value, 'module': module, 'api_instance_id': who.api};
            by = "*_and";
        }
        const AttachmentMapper = MapperFactory.build(MapperFactory.ATTACHMENT);
        var executor = (resolve, reject)=> {
            AttachmentMapper.findDomainRecord({by, value}, offset, limit)
                .then(result=> {
                    let attachments = result.records;
                    let processed = 0;
                    let rowLen = attachments.length;
                    attachments.forEach(attachment=> {
                        attachment.user().then(res=> {
                            attachment.user = res.records.shift();
                            delete attachment.user.password;
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
     * @param files
     * @param who
     * @param API
     */
    createAttachment(body = {}, who = {}, files = [], API) {
        const Attachment = DomainFactory.build(DomainFactory.ATTACHMENT);
        body['api_instance_id'] = who.api;
        let attachment = new Attachment(body);

        //Get Mapper
        const AttachmentMapper = MapperFactory.build(MapperFactory.ATTACHMENT);
        return AttachmentMapper.createDomainRecord(attachment).then(attachment=> {
            if (!attachment) return Promise.reject();
            return Util.buildResponse({data: attachment});
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
        console.log(body);
        //for incoming request , the module name and request-id is required and there must be a file
        if (!body.module || !body['request_id'] || files.length == 0) {
            return Promise.reject(Util.buildResponse({
                status: "fail",
                data: {message: 'Nothing to do'}
            }, 400));
            
        }
        let requestId = body['request_id'];

        if (!this.context.getIncoming(requestId)) {
            console.log("Not REquest ID found")
            return Promise.reject(Util.buildResponse({
                status: "fail",
                data: {message: 'Request ID Not Found'}
            }, 404));
        }

        let attachments = [];

        if (files.length) files.forEach(file=>attachments.push(new Attachment({
            module: `${body.module}`,
            relation_id: `${this.context.getIncoming(requestId)}`,
            file_name: file.filename,
            file_size: file.size,
            file_path: file.path,
            file_type: file.mimetype
        })));

        let executor = (resolve, reject) => {
            let processed = 0;
            let rowLen = attachments.length;
            let attachmentIds = [];
            attachments.forEach(attachment=> {
                this.createAttachment(attachment, who).then(response=> {
                    if (++processed == rowLen) {
                        attachmentIds.push(response.data.data.id);
                        this.context.deleteIncoming(requestId);
                        return resolve(Util.buildResponse({data: true}));
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
    deleteAttachment(by = "id", value) {
        const AttachmentMapper = MapperFactory.build(MapperFactory.ATTACHMENT);
        return AttachmentMapper.deleteDomainRecord({by, value}).then(count=> {
            if (!count) {
                return Util.buildResponse({status: "fail", data: {message: "The specified record doesn't exist"}});
            }
            return Util.buildResponse({data: {by, message: "Attachment deleted"}});
        });
    }
}

module.exports = AttachmentService;