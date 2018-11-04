/**
 * @type API
 */
let API = require('../index').test();

test("Test that you can create location", () => {
    const locationHistory = {
        module: "users",
        relation_id: "1",
        location: {
            x: 1.655342,
            y: 2.345334
        }
    };
    return expect(API.locations().createLocationHistory(locationHistory, {sub: 1})).resolves.toEqual(expect.objectContaining({
        code: 200
    }));
});


test("Test that you can search for location history of a user", () => {
    const query = {group_id: 1};
    return expect(API.locations().getLocationHistory(query, {}, API)).resolves.toEqual(expect.objectContaining({
        code: 200
    }));
});