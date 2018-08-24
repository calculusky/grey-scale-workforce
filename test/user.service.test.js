/**
 * Created by paulex on 7/11/17.
 */
const API = require('../index').test();

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
            _token: 'ZjOzAzIGD5hLrTSh1KNMmZlL5IxdLoNoRS52PaGj',
            first_name: 'IE CCO_USER',
            middle_name: '',
            last_name: 'Test',
            gender: 'M',
            username: 'cco_user',
            email: '03balogun@gmail.com',
            mobile_no: '08131174231',
            alt_mobile_no: '',
            group_id: '7',
            user_type: 'admin',
            password: 'admin$$',
            roles: '1'
        }
        , {sub: 1, group: 1}, API)
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

test("That we can reset a user password", () => {
    const body = {
        email: "donpaul120@gmail.com",
        password_confirmation: "admin1234",
        password: "admin1234",
        token: "92c5a7dc4535b2ea326a9f4ef5e6735c5d1ed59a4ad7d22d0679f69bf3898a95",
    };
    return expect(API.users().resetPassword(body, API)).resolves.toBeDefined();
});


describe('Updating User', () => {
    test('Update a user', () => {
        return expect(API.users().updateUser('id', 1,
            {last_name: "Okeke", roles: 1, group_id: 1, assigned_to: "[1]"}, {}, [], API)).resolves
            .toEqual(expect.objectContaining({
                code: expect.any(Number)
            }))
    });
});


test("Delete a user", () => {
    return expect(API.users().deleteUser('id', 51, {}, API)).resolves.toBeDefined();
});


afterAll(() => {
    API.users().deleteUser("username", "cco_user").then(t => console.log(t)).catch(err => console.log(err));
});