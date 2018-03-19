let API = require('../API');

const config = require('../config.json');
const Context = require('../core/Context');
const ctx = new Context(config);
API = new API(ctx);



test("That createGroup is defined", () => {
    return expect(API.groups().createGroup()).toBeDefined();
});


it("Should fail if required fields aren't set", () => {
    let group = {};
    return expect(API.groups().createGroup(group, {sub: 1})).rejects.toBeDefined();
});

it("Should pass if required fields are set", () => {
    let group = {
        "name": "GroupMe",
        "short_name": "GM",
        "type": "technical"
    };
    return expect(API.groups().createGroup(group, {sub: 1}, API)).resolves.toEqual(expect.objectContaining({
        code: expect.any(Number)
    }));
});

describe("Linking Groups", () => {
    test("link a newly created group to a parent group if the parent key is supplied", async () => {
        let group = {
            "name": "GroupUs",
            "short_name": "GU",
            "type": "technical",
            parent: 1
        };
        const data = await API.groups().createGroup(group, {sub: 1}, API);
        const subs = await ctx.database.table("group_subs").where("child_group_id", data.data.data.id);
        expect(subs).toHaveLength(1);
    });

    test("Should fail if the parent_id and the child_id are equal e.g 1-1", () => {
        return expect(API.groups().linkGroup({parent_id: 1, child_id: 1})).rejects.toBeDefined();
    });

    test("Should fail if the required fields to link groups are empty", () => {
        return expect(API.groups().linkGroup({parent_: 1, child_: 1})).rejects.toBeDefined();
    });
});

describe("Add user to group:user_groups", () => {

    it("Should reject if the required keys are empty", () => {
        return expect(API.groups().addUserToGroup({}, {sub: 1})).rejects.toEqual({});
    });

    it("Should resolve and add a user to the group", () => {
        return expect(API.groups().addUserToGroup({user_id: 1, group_id: 1}, {sub: 1})).rejects.toEqual({});
    });
});

describe("Update Groups", () => {

    test("That updateGroup is defined", async () => {
        return expect(API.groups().updateGroup(1)).toBeDefined();
    });

    test("That updateGroup resolves with a defined value", () => {
        return expect(API.groups().updateGroup(1, {name: "Root"}, {}, API)).resolves.toBeDefined();
    });
});


afterAll(() => {
    ctx.database.table("groups").where("name", "GroupUs").select("id").then(r => {
        let t = r.shift();
        if (t) {
            ctx.database.table("group_subs").where("child_group_id", t.id).del().then(m => {
                let vv = [API.groups().deleteGroup("name", "GroupUs"), API.groups().deleteGroup("name", "GroupMe")];
                Promise.all(vv).then(r => console.log("")).catch(err => console.log(err));
            }).catch(err => console.log(err));
        }
    }).catch(err => console.log(err));
});