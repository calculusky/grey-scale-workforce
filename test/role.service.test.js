/**
 * @type {API}
 */
const [API, ctx] = require('../index').test();
const globalMock = require('./setup/ApplicationDependency');

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

describe("Roles Creation", () => {

    beforeAll(() => {
        tracker.on('query', query => {
            if (query.method === 'insert') {
                return query.response([1, {
                    fieldCount: 0,
                    affectedRows: 1,
                    insertId: 1,
                    changedRows: 1
                }]);
            }
        });
    });

    it("CreateRole Should fail when mandatory fields are missing", () => {
        let role = {};
        return expect(API.roles().createRole(role, session)).rejects.toBeDefined();
    });

    it("CreateRole Should pass when mandatory fields are specified", () => {
        let role = {
            "name": "Paul Permission",
            "slug": "paul-permit",
            "permissions": '{"dashboard.access": true}'
        };
        return expect(API.roles().createRole(role, session)).resolves.toMatchObject({
            code: 200,
            data: {
                data: {
                    ...role,
                    assigned_to: expect.any(String),
                    created_at: expect.any(String),
                    created_by: 1
                }
            }
        });
    });

});

describe("Role Update", () => {

    const body = {name: "CaNTraL C3nTa"};

    beforeAll(() => {
        tracker.on('query', query => {
            query.response([body, 1])
        });
    });

    it("UpdateRole should pass when mandatory fields are given", async () => {
        return expect(API.roles().updateRole(4, body, session)).resolves.toMatchObject({
            code: 200,
            data: {
                data: {
                    id: 4,
                    name: "CaNTraL C3nTa"
                }
            }
        })
    });

});


describe("Add User to Roles", () => {

    beforeAll(() => {
        tracker.on('query', query => {
            if (query.method === 'insert') {
                return query.response([{
                    fieldCount: 0,
                    affectedRows: 1,
                    insertId: 1,
                    changedRows: 1
                }])
            }
        });
    });

    it("AddUserToRole should be defined", () => {
        return expect(API.roles().addUserToRole({}, {})).rejects.toBeDefined();
    });

    it("AddUserToRole Should fail if the user_id or the role_id isn't defined", () => {
        return expect(API.roles().addUserToRole()).rejects.toMatchObject({
            code: 400,
            err: {
                code: "VALIDATION_ERROR",
                data: {
                    role_id: ['The role id field is required.'],
                    user_id: ['The user id field is required.']
                }
            }
        });
    });

    it("AddUserToRole Should pass when valid role_id and user_id are given", () => {
        return expect(API.roles().addUserToRole(3, 1)).resolves.toEqual(expect.objectContaining({
            code: 200,
            data: {
                data: {
                    role_id: 3,
                    user_id: 1,
                    created_at: expect.any(String),
                    updated_at: expect.any(String)
                },
                status: "success"
            }
        }));
    });

});

describe("Update User Role", () => {

    it("UpdateUserRole should be defined", () => {
        return expect(API.roles().updateUserRole({}, {})).toBeDefined();
    });

    it("UpdateUserRole Should fail mandatory input parameters are undefined/null", () => {
        return expect(API.roles().updateUserRole()).rejects.toThrow();
    });

});

describe("Get Roles", () => {
    const dummyRole ={
        id: 1,
        slug: "bug-free",
        name: "role buzz",
        created_by: 1,
        created_at:"",
        updated_at:""
    };

    beforeAll(() => {
        tracker.on('query', query => {
            return query.response([dummyRole])
        });
    });

    it("GetRoles should pass and return role items", () => {
        return expect(API.roles().getRoles(1, 'id', session)).resolves.toMatchObject({
            code:200,
            data:{
                data:{
                    items:[dummyRole]
                }
            }
        })
    });
});


describe("Role Deletion", ()=>{
    it("DeleteRole should delete a role successfully", ()=>{
       return expect(API.roles().deleteRole('id', 1, session)).resolves.toMatchObject({
           code:200,
           data:{
               data:{
                   message:"Role deleted successfully."
               }
           }
       });
    });
});
