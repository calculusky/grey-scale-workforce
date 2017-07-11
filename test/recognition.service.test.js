/**
 * Created by paulex on 7/10/17.
 */

const API = require('../API');

it("Should should check that the username and password are  not empty", ()=> {
    return expect(API.recognitions().login()).rejects.toEqual({
        err: {
            status: 'fail',
            data: {
                username: "Missing required field 'username'.",
                password: "Missing required field 'password'."
            }
        },
        code: 400
    });
});


it("Should return 401 if the user doesn't exist", ()=> {
    return expect(API.recognitions().login("donpaul", "adebisi")).rejects.toEqual({
        err: {
            status: 'fail',
            data: {
                message: "Unauthorized",
                description: "The username or password is incorrect"
            }
        },
        code: 401
    });
});

let user = null;
beforeAll(()=> {
    return API.users().createUser({
        email: "donpaul120@gmail.com",
        username: "paulex",
        password: "admin",
        first_name: "Okeke",
        last_name: "Paul",
        middle_name: "Ugo",
        gender: "M",
        api_instance_id: 1
    }, {api: 1})
        .then(data=> {
            user = data.data.data;
        });
});


// describe("What data is returned when log-in is successful", ()=> {
// expect.assertions(4);
it("What data is returned when log-in is successful", ()=> {
    let User = require('../modules/Users/model/domain-objects/User');
    return expect(API.recognitions().login("paulex", "admin")).resolves.toEqual({
        data: {
            status: "success",
            data: {
                user: expect.any(User),
                token: expect.any(String)
            }
        },
        code: 200
    });
});
// });

//Delete this user after all the test has ran
afterAll(()=> {
    return API.users().deleteUser("username", "paulex");
});