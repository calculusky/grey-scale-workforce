/**
 * @type {API}
 */
const [API, ctx] = require('../index').test();
const globalMock = require('./setup/ApplicationDependency');

let knexMock, tracker, session;

beforeAll(async (done) => {
    [knexMock, tracker, session] = await globalMock.applicationBeforeAll(ctx);
    tracker.uninstall();
    done();
});

afterAll(async done => {
    await ctx.getPersistence().disconnect();
    knexMock.unmock(ctx.db(), 'knex@0.15.2');
    done();
});


describe("Upload File", () => {
    beforeAll(() => {
        tracker.install();
        tracker.on('query', query => {
            if (query.method === 'insert') {
                return query.response([1, {insertRows: 2}]);
            }
        });
    });

    it("UploadFile should fail if mandatory fields are missing", () => {
        return expect(API.uploads().uploadFile({}, session)).rejects.toMatchObject({
            code: 400,
            err: {
                data: {
                    upload_type: ["The upload type is required."]
                }
            }
        });
    });


    it("UploadFile should fail if files is empty", () => {
        const upload = {upload_type: "delinquencies"};
        return expect(API.uploads().uploadFile(upload, session)).rejects.toMatchObject({
            code: 400,
            err: {
                data: {
                    files: ["The files doesn't exist."]
                }
            }
        });
    });


    it("UploadFile should upload file successfully", () => {
        const upload = {upload_type: "delinquencies"};
        const files = [{
            size: 10.2,
            originalname: "aVeryLongName.jpeg",
            path: "/mime/path",
            filename: "aName.jpg",
            mimetype: "image/jpeg"
        }, {
            size: 10.2,
            originalname: "someShortName.jpeg",
            path: "/mime/path2",
            filename: "aName.png",
            mimetype: "image/png"
        }];
        return expect(API.uploads().uploadFile(upload, session, API, files)).resolves.toMatchObject({
            code: 200,
            data: {
                data: {
                    items: [{
                        file_path: "/mime/path"
                    }, expect.any(Object)]
                }
            }
        })
    });

    afterAll(() => {
        tracker.uninstall();
    })
});


describe("Retrieve UploadedFiles", () => {
    beforeAll(() => {
        tracker.install();
        tracker.on('query', query => {
            if (query.sql.indexOf('from `uploads`') !== -1) {
                return query.response([{
                    id: 1,
                    file_name: "test.png",
                    file_type: "image/jpg",
                    upload_type: "delinquencies"
                }]);
            }
        });
    });
    afterAll(() => tracker.uninstall());

    it("GetUploads should retrieve a list of uploads", () => {
        return expect(API.uploads().getUploads({id: 1, module: "test"}, session)).resolves.toMatchObject({
            code: 200,
            data: {
                data: {
                    items: [{
                        id: 1,
                        file_name: "test.png",
                        file_type: "image/jpg",
                        upload_type: "delinquencies"
                    }]
                }
            }
        })
    });
});

describe("Upload DataTable", () => {
    beforeAll(() => {
        tracker.install();
        tracker.on('query', query => {
            if (query.sql.indexOf('select count') !== -1) {
                return query.response([{
                    cnt: 1,
                }]);
            }
            return query.response([]);
        });
    });
    afterAll(() => tracker.uninstall());
    it("GetUploadDataTableRecords should fetch uploads records in dataTable format", () => {
        return expect(API.uploads().getUploadDataTableRecords({}, session)).resolves.toMatchObject({
            data: []
        });
    });
});
