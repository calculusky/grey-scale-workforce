/**
 * Created by paulex on 9/17/17.
 */

let API = require('../API');
API = new API();
const Attachment = require('../modules/Attachments/model/domain-objects/Attachment.js');
test("Should Fail Without the file details", ()=> {
    return expect(
        API.attachments().createAttachment({
            'module': "agetron",
            "relation_id": "magical"
        })
    ).rejects.toBeDefined();
});


test("Should be successful with the required parameters", ()=>{
    return expect(
        API.attachments().createAttachment({
            'module': "agetron",
            "relation_id": 1
        }, {sub: 1}, [{
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
            }])
    ).resolves.toBeDefined();
});

// it("Should Fail when nothing neither a domain object or an array of domainObject is given", ()=>{
//     return expect(()=>{
//         // let attachment = new Attachment();
//         API.attachments().createAttachment({})
//     }).toThrow("ddd");
// });