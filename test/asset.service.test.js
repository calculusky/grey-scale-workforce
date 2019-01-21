/**
 * @type {API}
 */
const [API, ctx] = require('../index').test();

//Mock Knex Database
const knexMock = require('mock-knex');
const tracker = knexMock.getTracker();


beforeAll(async (done) => {
    tracker.install();
    knexMock.mock(ctx.db(), 'knex@0.15.2');
    tracker.on('query', query => {
        query.response([]);
    });
    await new Promise((res, rej) => {
        ctx.on('loaded_static', () => {
            ctx.setKey("groups", '{"1":{ "id": 1, "name": "Abule-Egba-BU","type": "business_unit","short_name": "ABL"}}');
            res();
            done();
        });
    });
});

afterAll(async done => {
    await ctx.getPersistence().disconnect();
    knexMock.unmock(ctx.db(), 'knex@0.15.2');
    done();
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


it("Get fault of an asset", () => {
    return expect(API.assets().getAssetFaults(1)).resolves.toEqual(expect.objectContaining({
        code: expect.any(Number),
        data: expect.any(Object)
    }));
});