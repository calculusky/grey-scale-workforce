/**
 * Created by paulex on 6/02/18.
 */

/**
 * @type API {API}
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

describe("MaterialLocation Creation", () => {

    beforeAll(() => {
        tracker.on('query', query => {
            if (query.method === 'insert') {
                return query.response([1, {
                    fieldCount: 0,
                    affectedRows: 1,
                }])
            }
        });
    });

    it("CreateMaterialLocation should fail when mandatory fields are missing", () => {
        return expect(API.materialLocations().createMaterialLocation({}, session, API)).rejects.toMatchObject({
            code: 400,
            err: {
                data: {
                    material_id: ["The material id is required."],
                    group_id: ["The group id is required."],
                    quantity: ["The quantity is required."]
                }
            }
        });
    });


    it("Creation of material locations should pass", () => {
        const materialLocation = {
            "material_id": 3,
            "group_id": 1,
            "quantity": 58
        };
        return expect(
            API.materialLocations().createMaterialLocation(materialLocation, session, API)
        ).resolves.toMatchObject({
            code: 200,
            data: {
                data: materialLocation
            }
        });
    });

});

