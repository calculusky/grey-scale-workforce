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

describe("Validate fields before inserting", ()=>{
    it("Should return the field that didn't pass validation", ()=>{
        return expect(API.users().createUser({
            email: "bankole"
        }, {api:1})).rejects.toEqual({
            "code": 400,
            "err": {
                "data": {"message": "I was expecting an email address in email"}, "status": "fail"
            }
        });
    });
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