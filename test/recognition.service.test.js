/**
 * Created by paulex on 7/10/17.
 */
let [API, ctx] = require('../index').test();
const User = require('../modules/Users/model/domain-objects/User');
const globalMock = require('./setup/ApplicationDependency');

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

it("Should should check that the username and password are  not empty", () => {
    return expect(API.recognitions().login(undefined, undefined, {headers: {}})).rejects.toMatchObject({
        err: {
            status: 'fail',
            data: {
                username: ["The username is required."],
                password: ["The password is required."]
            }
        },
        code: 400
    });
});

describe("User Authentication", () => {
    const userData = {
        id: 1,
        username: "admin",
        password: "$2y$10$s8NkEd9LS3MD0pYgsFWvY.OqKo2OpVExyHNylGNcv1dWelTY8y9Am" //admin$$
    };
    beforeAll(() => {
        tracker.on('query', query => {
            if (query.sql.indexOf('from `roles`') !== -1) {
                return query.response([{
                    id: 1,
                    name: "Excuses",
                    slug: "test",
                    permissions: '{"works.access":true,"works.index":"group","works.create":false,"works.show":"all","works.edit":"all"}'
                }]);
            }
            if (query.sql.indexOf("from `users`") && !query.bindings.includes("donpaul")) {
                return query.response([userData]);
            }
        });
    });

    it("Should return 401 if the user doesn't exist", () => {
        return expect(API.recognitions().login("donpaul", "adebisi", {headers: {}})).rejects.toEqual({
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

    it("Retrieve a token after login", async () => {
        return expect(API.recognitions().login("admin", "admin$$", {headers: {}})).resolves.toMatchObject({
            code: 200,
            data: {
                data: {
                    permitted_groups: expect.any(Array),
                    token: expect.any(String),
                    user: expect.any(User)
                }
            }
        });
    });


    it("Login and Authenticate with the retrieved token", async () => {
        const response = await API.recognitions().login("admin", "admin$$", {headers: {}});
        const token = response.data.data.token;

        const req = {
            header: (key) => {
                return token;
            }
        };

        await API.recognitions().auth(req, {}, req.header);
        expect(req.who.getToken()).toEqual(token);
        expect(req.who.getAuthUser().getUserId()).toEqual(1);
        return expect(req.who.getAuthUser().getUsername()).toEqual("admin");
    });

    it("Login and Authenticate and retrieve session extras", async () => {
        const response = await API.recognitions().login("admin", "admin$$", {headers: {}});
        const token = response.data.data.token;

        const req = {
            header: (key) => {
                return token;
            }
        };

        await API.recognitions().auth(req, {}, req.header);
        return expect(req.who.getExtraKey("pmToken")).toEqual("Token");
    });
});