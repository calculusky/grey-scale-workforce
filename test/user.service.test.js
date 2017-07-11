/**
 * Created by paulex on 7/11/17.
 */

const API = require('../API');

beforeAll(()=> {
    return API.users().createUser({
        email: "bankole@gmail.com",
        username: "banky",
        password: "admin",
        first_name: "Bankee",
        last_name: "Odemu",
        middle_name: "Ugo",
        gender: "M",
        api_instance_id: 1
    }, {api: 1})
        .then(data=> {
            user = data.data.data;
        });
});

it("Should resolve without an input", ()=> {
    return expect(API.users().getUsers()).resolves.toBeDefined();
});

it("Should return a user object", ()=> {
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


afterAll(()=> {
    return API.users().deleteUser("username", "banky");
});