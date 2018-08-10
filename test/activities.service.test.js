
const API = require('../index').test();

/**
 *
 * @type {API}
 */

it("Should create an activity:", () => {
    return expect(API.activities().createActivity({
        module: "faults",
        relation_id: 12,
        activity_type: "create",
        description: "description!!!",
        activity_by: 1,
        group_id: `1`,
        source: "internal"
    })).resolves.toEqual(
        expect.objectContaining({
            code: expect.any(Number),
            data: expect.any(Object)
        })
    );
});
