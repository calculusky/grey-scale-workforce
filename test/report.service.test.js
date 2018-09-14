/**
 * @type {API}
 */
const API = require('../index').test();

test("Test ", () => {
    return expect(API.reports().getBasicDashboard({sub: 1})).resolves.toEqual({});
});
