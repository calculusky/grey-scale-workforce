/**
 * Created by paulex on 6/02/18.
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

describe("Materials Creation", () => {

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

    it("CreateMaterial Should fail when mandatory fields are missing", () => {
        return expect(API.materials().createMaterial({}, session)).rejects.toMatchObject({
            code: 400,
            err: {
                data: {
                    name: ["The name is required."],
                    unit_of_measurement: ["The unit of measurement is required."]
                }
            }
        });
    });

    it("CreateMaterial should pass when mandatory fields are specified", () => {
        const body = {name: "Copper Wire", unit_of_measurement: "CM"};
        return expect(API.materials().createMaterial(body, session)).resolves.toMatchObject({
            code: 200,
            data: {
                data: body
            }
        });
    });
});

describe("Material Update and Search", () => {

    beforeAll(() => {
        tracker.on('query', query => {
            if (query.sql.indexOf('from `materials`')) {
                return query.response([{
                    id: 1,
                    name: "Simulation"
                }]);
            }
        });
    });

    it("UpdateMaterial should pass successfully", () => {
        const material = {name: 'Simulation'};
        return expect(API.materials().updateMaterial('id', 1, material, session)).resolves.toMatchObject({
            code: 200,
            data: {
                data: {
                    id: 1,
                    name: "Simulation"
                }
            }
        });
    });

    it("SearchMaterial should pass and return material items", () => {
        return expect(API.materials().searchMaterials("test")).resolves.toMatchObject({
            code: 200,
            data: {
                data: {
                    items: [
                        {id: 1, name: "Simulation"}
                    ]
                }
            }
        });
    });

});

describe("Retrieve List of Materials", () => {

    beforeAll(()=>{
        tracker.on('query', query=>{
            if (query.sql.indexOf('from `materials`')) {
                return query.response([{
                    id: 1,
                    name: "Simulation",
                    unit_price: 23.19
                }]);
            }
        })
    });

    it("GetMaterials should get a list of materials", () => {
        return expect(API.materials().getMaterials({unit_price: 23.19}, {})).resolves.toMatchObject({
            code: 200,
            data: {
                data: {
                    items: [{
                        id: 1,
                        name:"Simulation",
                        unit_price: 23.19
                    }],
                }
            }
        });
    });

});


it("DeleteMaterials delete material successfully.", ()=>{
    return expect(API.materials().deleteMaterial('id', 1, session)).resolves.toMatchObject({
        code:200,
        data:{
            data:{
                message:"Material successfully deleted."
            }
        }
    });
});