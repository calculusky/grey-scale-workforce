/**
 * Created by paulex on 7/11/17.
 */
require('dotenv').config();
let API = require('../API');

const config = require('../config.json');
const Context = require('../core/Context');
API = new API(new Context(config));

// beforeAll(() => {
//     return API.users().createUser({
//         email: "bankole@gmail.com",
//         username: "banky",
//         password: "admin",
//         first_name: "Bankee",
//         last_name: "Odemu",
//         middle_name: "Ugo",
//         mobile_no:"08139201337",
//         gender: "M",
//     }, {sub: 1, group:1})
//         .then(data => {
//             user = data.data.data;
//         }).catch(err => {
//             console.log(err);
//         });
// });

it("Should create a user and attach a role to the user", () => {
    return expect(API.users().createUser({
            email: "bankole@gmail1.com",
            username: "banky1",//TODO generate
            password: "admin",
            first_name: "Bankee",
            last_name: "Odemu",
            middle_name: "Ugo",
            mobile_no: "08139201337",
            gender: "M",
            "roles": 1
        }, {sub: 1, group: 1}, API)
    ).resolves.toEqual(expect.objectContaining({
        code: expect.any(Number)
    }));
});

it("Should resolve without an input", () => {
    return expect(API.users().getUsers()).resolves.toBeDefined();
});

describe("Validate fields before inserting", () => {
    it("Should return the field that didn't pass validation", () => {
        return expect(API.users().createUser({
            email: "bankole"
        }, {api: 1})).rejects.toEqual({
            "code": 400,
            "err": {
                "data": {"message": "I was expecting an email address in email"}, "status": "fail"
            }
        });
    });
});

it("Should return a user object", () => {
    return expect(API.users().getUsers("banky", "username")).resolves.toEqual({
        data: {
            status: "success",
            data: {
                items: expect.any(Array)
            }
        },
        code: 200
    });
});

test("That we can register an fcm_token", () => {
    let token = 'ekY2r-BX0Mc:APA91bEiOWiXgFsSf_XIc2y3ACI-DvSZtFeG2M0485Azw4iGusX8tLlhK_Pou46a9_u03HAQSFQFN-5ZuC8qJmNTRxL3oeV7R0AoZg2iTNHGmhhipDhxgRc24FeEZn-bOdakRQ3x7WyW';
    return expect(API.users().registerFcmToken(token, {sub: 1})).resolves.toEqual({
        code: 200,
        data: {
            data: {
                "firebase_token": token
            },
            "status": "success"
        }
    })
});


describe('Updating User', () => {
    test('Update a user', () => {
        return expect(API.users().updateUser('id', 1, {first_name: "Bolanle", roles: 1, group_id: 3}, {}, API)).resolves
            .toEqual(expect.objectContaining({
                code: expect.any(Number)
            }))
    });
});


test("Delete a user", () => {
    return expect(API.users().deleteUser('id', 51, API)).resolves.toBeDefined();
});

//
// afterAll(() => {
//     API.users().deleteUser("username", "banky1").then(t => console.log(t)).catch(err => console.log(err));
// });