/**
 * @type {API}
 */
const API = require('../index').test();

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

test("That we can get activities by query", () => {
    expect.assertions(1);
    return API.activities().getActivities({
        module: "work_orders",
        relation_id: 28,
    }, {}, API).then(res => {
        expect(res).toEqual(expect.objectContaining({
            code: expect.any(Number),
            data: expect.any(Object)
        }))
    })
});
