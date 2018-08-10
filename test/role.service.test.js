
const API = require('../index').test();


test("createRole is defined", () => {
    let role = {};
    return expect(API.roles().createRole(role, {sub: 1})).toBeDefined();
});

it("Should fail if required fields aren't set", () => {
    let role = {};
    return expect(API.roles().createRole(role, {sub: 1})).rejects.toBeDefined();
});

it("Should pass if required fields are set", () => {
    let role = {
        "name": "Paul Permission",
        "slug": "paul-permit",
        "permissions": {
            "dashboard.access": true
        }
    };
    return expect(API.roles().createRole(role, {sub: 1})).resolves.toEqual(expect.objectContaining({
        code: expect.any(Number)
    }));
});


test("addUserToRole is defined", () => {
    return expect(API.roles().addUserToRole({}, {})).toBeDefined();
});


it("Should fail if the user_id or the role_id isn't defined", () => {
    return expect(API.roles().addUserToRole()).rejects.toBeDefined();
});

it("Should fail if the role_id or the user_id doesn't exist", () => {
    return expect(API.roles().addUserToRole(990, 1)).rejects.toBeDefined();
});

it("Should pass having been specified a valid role_id and user_id", () => {
    return expect(API.roles().addUserToRole(3, 1)).resolves.toEqual(expect.objectContaining({
        code: expect.any(Number)
    }));
});