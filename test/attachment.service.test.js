/**
 * Created by paulex on 9/17/17.
 */

const [API, ctx] = require('../index').test();
const globalMock = require('./setup/ApplicationDependency');
/**
 * @param session {Session}
 */
let knexMock, tracker, session;

beforeAll(async (done) => {
    [knexMock, tracker, session] = await globalMock.applicationBeforeAll(ctx);
    done();
});

afterAll(async done => {
    await ctx.getPersistence().disconnect();
    knexMock.unmock(ctx.db(), 'knex@0.15.2');
    done();
});

describe("Attachment(s) Creation", () => {

    beforeAll(() => {
        tracker.on('query', query => {
            if (query.method === 'insert') {
               return query.response([1,{}])
            }
        });
    });

    it("createAttachment should fail if mandatory fields are missing", () => {
        const body = {'module': "agetron", "relation_id": "magical"};
        return expect(API.attachments().createAttachment(body, session, [], API)).rejects
            .toMatchObject({
                code: 400,
                err: {data: {file_path: ["The file path is required."]}}
            });
    });


    it("CreateAttachment_ in multiples If_The Required Details Are Given", () => {
        return expect(
            API.attachments().createAttachment({
                'module': "agetron",
                "relation_id": 1,
                "location": "null"
            }, session, [
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
        ).resolves.toMatchObject({
            code: 200,
            data: {
                data: {
                    file_name: "oya",
                    file_path: "/mmmmyyy"
                }
            }
        });
    });

    it("CreateAttachment should create attachment", () => {
        const attachment = {
            file_name: "test_file",
            file_path: "path2",
            file_type: "image/jpeg",
            relation_id: "1",
            module: "work_orders",
            file_size: "12",
            // location:'{"x":44.3323, "y":4.64232}'
        };
        return expect(API.attachments().createAttachment(attachment, session, [], API)).resolves.toMatchObject({
            code: 200,
            data: {
                data: {
                    file_name: "test_file",
                    file_path: "path2",
                    file_type: "image/jpeg",
                    relation_id: "1",
                    module: "work_orders",
                    file_size: "12",
                    // location: expect.any(Object)
                }
            }
        });
    });

});


describe("Retrieve and Delete Attachment", () => {
    const attachments = [
        {
            id: 1,
            relation_id: 5,
            module: "faults",
            file_name: "03817c15cfdd4561bef14593ba8903db",
            file_size: 1124921,
            file_type: "image/jpeg",
            created_by: 1,
            created_at: "2018-10-31 23:42:48"
        }
    ];
    beforeAll(() => {
        tracker.on('query', query => {
            if (query.sql.indexOf("select * from `attachments`") !== -1) {
                return query.response(attachments);
            }
        });
    });

    it("getAttachments Should Return Attachment Items", () => {
        return expect(API.attachments().getAttachments(1, "agetron", "relation_id")).resolves.toMatchObject({
            code: 200,
            data: {
                data: {
                    items: [...attachments]
                }
            }
        });
    });

    it("DeleteAttachment Should Return a message", () => {
        return expect(API.attachments().deleteAttachment("id", 1, "faults", session)).resolves.toEqual({
            code: 200,
            data: {
                data: {
                    message: "Attachment deleted"
                },
                status: "success"
            },
        });
    });
});

