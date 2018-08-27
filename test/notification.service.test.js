/**
 * @type {API}
 */
const API = require('../index').test();


test("Test that we can update notifications in bulk", () => {
    const body = {
        bulk: [
            {id: 1, status: 2},
            {id: 2, status: 2},
        ]
    };
    return expect(API.notifications().updateNotification(undefined, undefined, body, {}, API))
        .resolves.toEqual(expect.objectContaining({
            cod: expect.any(Number),
            data: expect.any(Object)
        }));
});
