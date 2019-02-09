const Session = require('../core/Session');
const [API, ctx] = require('../index').test();
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

describe("Session Initialization", () => {

    it("Build Session with parameters", async () => {
        const session = await Session.Builder(ctx).setUser({username: "paul"}).setExpiry(3000).build();
        expect(session.getUser()).toEqual({username: "paul"});
        return expect(session.getToken()).toBeDefined();
    });

    it("Retrieve Default Session for a user", async ()=>{
        const User = require('../modules/Users/model/domain-objects/User');
        const session = await Session.Builder(ctx).setUser(new User({id: 1})).setExpiry(3000).default();
        expect(session.getPermittedGroups()).toHaveLength(1);
        return expect(session.getAuthUser().getUserId()).toEqual(1);
    });

});

describe("Retrieve userGroups, roles and permissions", () => {
    const User = require('../modules/Users/model/domain-objects/User');

    beforeAll(() => {
        tracker.on('query', query => {
            if (query.sql.indexOf('`role_users`')) {
                return query.response([{
                    id: 1,
                    name: "admin",
                    permissions: '{"assets.access": "true","assets.index": "all"}',
                    assigned_to: null,
                    group_id: 1,
                    created_by: "2018-10-29 15:46:59",
                    updated_at: "2018-10-29 15:46:59"
                }])
            }
            else if(query.sql.indexOf('`user_groups`')){
                console.log(query);
                return query.response([{

                }]);
            }
            else {
                query.response([{id: 1, name: "Abule-Egba-BU"}])
            }
        });
    });

    it("Verify that authUser is set with attributes", async () => {
        const user = new User({id: 1, username:"paulex10"});
        const session = await Session.Builder(ctx).setUser(user)
            .setExpiry(3600)
            .addExtra("pmToken", "12345")
            .build();
        return expect(session.getAuthUser().getPermission()).toBeDefined();
    });

    it("Permitted groups should contain user own groups", async ()=>{
        const user = new User({id: 1, username:"paulex10"});
        const session = await Session.Builder(ctx).setUser(user).setExpiry(3600).build();
        const session2 = await Session.Builder(ctx).validateToken(session.getToken());
        return expect(session2.getPermittedGroups()).toEqual(expect.arrayContaining([1]))
    });

    it("Values in session are new and not copies", async ()=>{
        const user = new User({id: 1, username:"paulex10"});
        const session = await Session.Builder(ctx).setUser(user).addExtra('pmToken', {text:"1"}).setExpiry(3600).build();
        const session2 = await Session.Builder(ctx).validateToken(session.getToken());
        const session3 = await Session.Builder(ctx).setUser(user).setExpiry(3600).build();
        expect(session.getExtras()).toEqual({'pmToken':{text:"1"}});
        expect(session2.getExtras()).toEqual({'pmToken':{text:"1"}});
        expect(session2.getAuthUser().getUserId()).toEqual(1);
        return expect(session3.getExtras()).toEqual({});
    });
});


describe("Token Verification", ()=>{
    it("ValidateToken should return null if token is not defined", ()=>{
        return expect(Session.Builder(ctx).validateToken()).resolves.toBeNull();
    });
});

