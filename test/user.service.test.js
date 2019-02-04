/**
 * Created by paulex on 7/11/17.
 */
const [API, ctx] = require('../index').test();
const globalMock = require('./setup/ApplicationDependency');
const User = require('../modules/Users/model/domain-objects/User');
const ProcessAPI = require('../processes/ProcessAPI');

const dummyUser = {
    id: 1,
    username: "paulex10",
    email: "pugochukwu@vas-consulting.com"
};

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

describe("User Creation", () => {

    beforeAll(() => {
        tracker.on('query', query => {
            if (query.method === 'insert') {
                return query.response([1, {
                    fieldCount: 0,
                    affectedRows: 1
                }]);
            }
            return query.response([]);
        });
        ProcessAPI.request = jest.fn().mockImplementation(() => {
            return Promise.resolve({USR_UID: "wfcases"})
        });
    });

    it("CreateUser Should create a user and attach a role to the user", () => {
        const body = {
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
        };
        const user = new User(body);
        user.created_by = 1;
        user.firebase_token = '[]';
        user.created_at = expect.any(String);
        user.updated_at = expect.any(String);
        delete user.password;
        return expect(API.users().createUser(body, session, API)).resolves.toMatchObject({
            code: expect.any(Number),
            data: {
                data: user
            }
        });
    });


    it("CreateUser should fail when mandatory fields are missing", () => {
        return expect(API.users().createUser({email: "bankole"}, session)).rejects.toEqual({
            "code": 400,
            "err": {
                code: "VALIDATION_ERROR",
                data: {
                    "email": ["The email format is invalid."],
                    "first_name": ["The first name is required."],
                    "gender": ["The gender is required."],
                    "last_name": ["The last name is required."],
                    "mobile_no": ["The mobile no is required."],
                    "username": ["The username is required."],
                    "password": ["The password is required."]
                },
                status: "fail"
            }
        });
    });

});

describe("Update User", () => {

    beforeAll(() => {
        tracker.on('query', query => {
            if (query.sql.indexOf('from `users`') !== -1) {
                dummyUser.assigned_to = [{id: 4, created_at: ""}, {id: 5, created_at: ""}];
                return query.response([dummyUser]);
            }
        });
    });

    it("UpdateUser should pass", () => {
        return expect(API.users().updateUser('id', 1, {first_name: 'bola'}, session, null, API)).resolves.toMatchObject({
            code: 200,
            data: {
                data: {
                    id: 1,
                    first_name: "bola"
                }
            }
        })
    });

    it("UpdateUser should also update user on process maker", () => {
        const pmUpdateUserMock = jest.spyOn(API.workflows(), "updateUser");
        return API.users().updateUser('id', 1, {first_name: 'bola'}, session, null, API).then(res => {
            return expect(pmUpdateUserMock).toHaveBeenCalled();
        });
    });

});


describe("GetUsers", () => {

    beforeAll(() => {
        tracker.on('query', query => {
            if (query.sql.indexOf('from `users`') !== -1) {
                return query.response([dummyUser]);
            }
        });
    });

    it("GetUsers Should resolve without an input", () => {
        return expect(API.users().getUsers()).resolves.toBeDefined();
    });


    it("GetUsers Should return a user object", () => {
        dummyUser.password = "";
        return expect(API.users().getUsers("banky", "username")).resolves.toEqual({
            data: {
                status: "success",
                data: {items: [dummyUser]}
            },
            code: 200
        });
    });

});


describe("User Password Reset", () => {

    beforeAll(() => {
        tracker.on('query', query => {
            if (query.sql.indexOf('select * from `password_resets`') !== -1) {
                return query.response([{
                    email: "donpaul120@gmail.com",
                    token: "$2b$10$ITGP83LL4cjAsSKI0LNA8.GxhimXMTp17/AgPpD67wyHpjtuQjl9C",
                    created_at: ""
                }]);
            } else if (query.sql.indexOf('from `users`') !== -1) {
                return query.response([dummyUser]);
            }
        });
    });

    it("ResetPassword should fail when mandatory fields are missing", () => {
        return expect(API.users().resetPassword({}, {}, API)).rejects.toMatchObject({
            code: 400,
            err: {
                code: "VALIDATION_ERROR",
                data: {
                    "password_confirmation": ["The password confirmation is required."],
                    "token": ["The token is required."],
                }
            }
        });
    });

    it("ResetPassword should pass when mandatory fields are given", () => {
        const body = {
            email: "donpaul120@gmail.com",
            password_confirmation: "admin1234",
            password: "admin1234",
            token: "92c5a7dc4535b2ea326a9f4ef5e6735c5d1ed59a4ad7d22d0679f69bf3898a95",
        };
        return expect(API.users().resetPassword(body, session, API)).resolves.toMatchObject({
            code: 200,
            data: {data: body}
        });
    });

    it("ResetPassword should fail when password and pass_confirmation are not same", () => {
        const body = {
            email: "donpaul120@gmail.com",
            password_confirmation: "admin1234",
            password: "admin4",
            token: "92c5a7dc4535b2ea326a9f4ef5e6735c5d1ed59a4ad7d22d0679f69bf3898a95",
        };
        return expect(API.users().resetPassword(body, session, API)).rejects.toMatchObject({
            code: 400,
            err: {
                code: "VALIDATION_ERROR",
                data: {password_confirmation: ["The password confirmation and password fields must match."]}
            }
        });
    });

    it("ResetPassword should update user with new password", () => {
        const body = {
            email: "donpaul120@gmail.com",
            password_confirmation: "admin1234",
            password: "admin1234",
            token: "92c5a7dc4535b2ea326a9f4ef5e6735c5d1ed59a4ad7d22d0679f69bf3898a95",
        };
        return expect(API.users().resetPassword(body, session, API)).resolves.toMatchObject({
            code: 200,
            data: {data: body}
        });
    });


});


describe("GetUserPermissions", () => {

    beforeAll(() => {
        ctx.setKey(`permissions:1`, '{"work_orders.update":true}');
    });

    it("GetUserPermissions should return the user's permission object", () => {
        return expect(API.users().getUserPermissions(1, session)).resolves.toMatchObject({
            code: 200,
            data: {
                data: {
                    "work_orders.update": true
                }
            }
        });
    });

    afterAll(() => {
        ctx.delKey('permissions:1');
    });

});


describe("Register and Unregister FCM Token", () => {

    beforeAll(() => {
        tracker.on('query', query => {
            if (query.sql.indexOf("JSON_ARRAY_APPEND(fire_base_token, '$', ?)") !== -1) {
                return query.response([1,{
                    fieldCount: 0,
                    affectedRows: 1,
                    insertId: 0,
                    serverStatus: 2,
                    warningCount: 0,
                    message: '',
                    protocol41: true,
                    changedRows: 1
                }]);
            } else if (query.sql.indexOf('FROM users') !== -1) {
                dummyUser.fire_base_token = "tere";
                return query.response([dummyUser]);
            }
        });
    });

    it("RegisterFcmToken should pass with a token", () => {
        let token = 'ekY2r-BX0Mc:APA91bEiOWiXgFsSf_XIc2y3ACI-DvSZtFeG2M0485Azw4iGusX8tLlhK_Pou46a9_u03HAQSFQFN-5ZuC8qJmNTRxL3oeV7R0AoZg2iTNHGmhhipDhxgRc24FeEZn-bOdakRQ3x7WyW';
        return expect(API.users().registerFcmToken(token, session)).resolves.toEqual({
            code: 200,
            data: {
                data: {
                    "firebase_token": token
                },
                "status": "success"
            }
        })
    });


    it("UnRegisterFcmToken should unregister the token", () => {
        let token = 'ekY2r-BX0Mc:APA91bEiOWiXgFsSf_XIc2y3ACI-DvSZtFeG2M0485Azw4iGusX8tLlhK_Pou46a9_u03HAQSFQFN-5ZuC8qJmNTRxL3oeV7R0AoZg2iTNHGmhhipDhxgRc24FeEZn-bOdakRQ3x7WyW';
        return expect(API.users().unRegisterFcmToken(token)).resolves.toMatchObject({
            code: 200,
            data: {
                data: expect.any(Array),
            }
        });
    });

    it("UnRegisterFcmToken should unregister and add a new token", () => {
        let token = 'ekY2r-BX0Mc:APA91bEiOWiXgFsSf_XIc2y3ACI-DvSZtFeG2M0485Azw4iGusX8tLlhK_Pou46a9_u03HAQSFQFN-5ZuC8qJmNTRxL3oeV7R0AoZg2iTNHGmhhipDhxgRc24FeEZn-bOdakRQ3x7WyW';
        return expect(API.users().unRegisterFcmToken(token, token + "ddd")).resolves.toMatchObject({
            code: 200,
            data: {
                data: expect.any(Array),
            }
        });
    });

});

describe("Delete User", () => {

    beforeAll(() => {
        tracker.on('query', query => {
            if (query.sql.indexOf('from `users`') !== -1) {
                return query.response([dummyUser]);
            }
        });
    });

    it("Delete a user", () => {
        return expect(API.users().deleteUser('id', 51, session, API)).resolves.toBeDefined();
    });

});

describe("User Related Data", () => {

    it("Should return the attachments that belongs to this user", () => {
        return expect(API.users().getUserAttachments(1, 0, 10, {sub: 1}, API)).resolves.toEqual({
            data: {
                status: "success",
                data: {
                    items: expect.any(Array)
                }
            },
            code: 200
        });
    });

    it("Should return the work orders that assigned to this user", () => {
        return expect(API.users().getUserWorkOrders(1, {offset: 0, limit: 10}, session, API)).resolves.toEqual({
            data: {
                status: "success",
                data: {
                    items: expect.any(Array)
                }
            },
            code: 200
        });
    });

});