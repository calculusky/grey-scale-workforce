/**
 * @type {API}
 */
const API = require('../index').test();


test("fetch assets", () => {
    return expect(API.assets().getAssets({
        group_id: 1
    }, {sub: 1})).resolves.toEqual(expect.objectContaining({
        code: expect.any(Number),
        data: expect.any(Object)
    }));
});

test("fetch a single asset", () => {
    return expect(API.assets().getAsset(1, "id",  {sub: 1})).resolves.toEqual(expect.objectContaining({
        code: expect.any(Number),
        data: expect.any(Object)
    }));
});

it("Search for an asset", () => {
    return expect(API.assets().searchAssets("wasim", 0, 10)).resolves.toEqual(expect.objectContaining({
        code: expect.any(Number),
        data: expect.any(Object)
    }));
});