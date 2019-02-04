/**
 * @type {API}
 */
const [API, ctx] = require('../index').test();
const globalMock = require('./setup/ApplicationDependency');

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

describe("Asset Creation", () => {

    beforeAll(() => {
        tracker.on('query', query => {
            if (query.method === 'insert') {
                return query.response([1, {
                    fieldCount: 0,
                    affectedRows: 1,
                }]);
            }
        });
    });

    it("CreateAsset should fail is mandatory fields are missing", () => {
        return expect(API.assets().createAsset({}, session)).rejects.toMatchObject({
            code: 400,
            err: {
                data: {
                    asset_name: ["The asset name is required."],
                    serial_no: ["The serial no is required."],
                    asset_type: ["The asset type is required."]
                }
            }
        })
    });

    it("CreateAsset should pass when all mandatory fields are given", () => {
        const assetDummy = {
            asset_name: "Example Asset",
            asset_type: 1,
            serial_no: "21232sds"
        };
        return expect(API.assets().createAsset(assetDummy, session)).resolves.toMatchObject({
            code: 200,
            data: {
                data: Object.assign(assetDummy, {assigned_to: expect.any(String), created_at: expect.any(String)})
            }
        });
    });
});


describe("Asset Updates", () => {

    beforeAll(() => {
        tracker.on('query', query => {
            if (query.sql.indexOf("select * from `assets`")!==-1) {
                return query.response([{
                    id:1,
                    asset_name:"Example Asset",
                    asset_type:1
                }]);
            }
            return query.response([{
                fieldCount: 0,
                affectedRows: 1,
            }]);
        });
    });

    it("UpdateAsset should pass successfully", () => {
        return expect(API.assets().updateAsset(1, {assigned_to: 1}, session)).resolves.toMatchObject({});
    });

});

describe("Retrieve Assets", () => {

    const assetQueryResponse = {
        id: 1,
        asset_name: "Asset Example",
        status: 1,
        group_id: 1,
        created_at: "2018-10-31 16:00:20",
        updated_at: "2018-10-31 16:00:20"
    };

    const expected = {
        code: 200,
        data: {
            data: {
                items: [{
                    id: 1,
                    asset_name: "Asset Example",
                    group_id: 1,
                    group: {
                        id: 1,
                        name: "Abule-Egba-BU"
                    },
                    business_unit: expect.any(Object),
                    undertaking: null,
                    created_at: "2018-10-31 16:00:20",
                    updated_at: "2018-10-31 16:00:20"
                }]
            }
        }
    };

    beforeAll(() => {
        tracker.on('query', query => {
            return query.response([assetQueryResponse]);
        });
    });

    it("Fetch assets with query params", () => {
        return expect(API.assets().getAssets({group_id: 1}, {sub: 1})).resolves.toMatchObject(expected);
    });

    it("fetch a single asset", () => {
        return expect(API.assets().getAsset(1, "id", {sub: 1})).resolves.toMatchObject(expected);
    });

    it("Search for an asset", () => {
        return expect(API.assets().searchAssets("wasim", 0, 10)).resolves.toMatchObject(expected);
    });
});

describe('Retrieve asset related data', () => {
    const faultData = {
        id: 1,
        relation_id: 1,
        related_to: "assets",
        labels: ["broken pole", "line cut"],
        status: 1,
        fault_category_id: 12,
        group_id: 1,
        assigned_to: [{id: 1, created_at: ""}],
        issue_date: "2018-10-31 16:00:20",
        created_at: "2018-10-31 16:00:20",
        updated_at: "2018-10-31 16:00:20"
    };
    const responseData = {
        code: 200,
        data: {
            data: {
                items: [{
                    id: 1,
                    related_to: "assets",
                    relation_id: 1,
                    labels: ["broken pole", "line cut"],
                    status: 1,
                    category_id: 12,
                    issue_date: "2018-10-31 16:00:20",
                    created_at: "2018-10-31 16:00:20",
                    updated_at: "2018-10-31 16:00:20"
                }]
            }
        }
    };
    beforeAll(() => {
        tracker.on('query', query => {
            return query.response([faultData]);
        });
    });

    it("Get fault of an asset", () => {
        return expect(API.assets().getAssetFaults(1)).resolves.toMatchObject(responseData);
    });
});