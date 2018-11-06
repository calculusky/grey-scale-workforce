/**
 * Created by paulex on 9/17/17.
 */

const API = require('../index').test();

const Attachment = require('../modules/Attachments/model/domain-objects/Attachment.js');


test("Should Fail Without the file details", ()=> {
    return expect(
        API.attachments().createAttachment({
            'module': "agetron",
            "relation_id": "magical"
        })
    ).rejects.toBeDefined();
});


test("Should be successful with the required parameters", ()=> {
    return expect(
        API.attachments().createAttachment({
            'module': "agetron",
            "relation_id": 1,
            "location":"null"
        }, {sub: 1, group:[1]}, [
            {
                filename: "nna",
                size: 1232,
                path: "/age",
                mimetype: "images/*"
            },
            {
                filename: "oya",
                size: 1232,
                path: "/mmmmyyy",
                mimetype: "testttt/*"
            }
        ])
    ).resolves.toBeDefined();
});

it("Should ", ()=> {
    return expect(API.attachments().getAttachments(1, "agetron", "relation_id")).resolves.toBeDefined();
});