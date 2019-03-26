/**
 * @type API {API}
 */
const [API, ctx] = require('../index').test();
const globalMock = require('./setup/ApplicationDependency');
const ProcessAPI = require('../processes/ProcessAPI');

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

//#Test that createGroup is defined /
//#Test that createGroup without mandatory fields fails /
//#Test that createGroup passes when given mandatory fields /
//#Test that createGroup also creates on ProcessMaker /
//#Test that when createGroup Fails, group isn't created locally /

//#Test that updateGroup is defined /
//#Test that we can updateGroup /
//#Test that when a group is update it is also updated on process maker /

//#Test that we can link a group to a parent group /
//#Test that when mandatory fields are missing when linking groups it fails /
//#Test that when parent value is specified while creating group the created group is linked /

//#Test that we can add user to group /
//#Test that we can update a user group /
//#Test that we can retrieve groups /
//#Test that we can retrieve users of a group /
//#Test that we can delete a group successfully

it("CreateGroup is Defined", () => {
    return expect(API.groups().createGroup()).rejects.toBeDefined();
});


it("CreateGroup Should fail when mandatory fields are missing.", () => {
    let group = {};
    return expect(API.groups().createGroup(group, {sub: 1})).rejects.toMatchObject({
        code: 400,
        err: {
            code: "VALIDATION_ERROR",
            data: {name: ["The name is required."]}
        }
    });
});

describe("Creating Group", () => {

    beforeAll(() => {
        ProcessAPI.request = jest.fn().mockImplementation(() => {
            return Promise.resolve({grp_uid: "wfcases"})
        });
        tracker.on('query', query => {
            if (query.method === 'insert') {
                return query.response([1, {
                    fieldCount: 0,
                    affectedRows: 1,
                }]);
            }
            return query.response([]);
        });
    });

    it("Should pass if required fields are set", () => {
        let group = {
            "name": "GroupMe",
            "short_name": "GM",
            "type": "technical"
        };
        return expect(API.groups().createGroup(group, session, API)).resolves.toMatchObject({
            code: 200,
            data: {
                data: {
                    id: 1,
                    name: "GroupMe",
                    short_name: "GM",
                    type: "technical"
                }
            }
        });
    });

    it("Should createGroup on process maker when group is valid", () => {
        let group = {
            "name": "GroupMe",
            "short_name": "GM",
            "type": "technical"
        };
        const createWorkFlowGroup = jest.spyOn(API.workflows(), 'createGroup');
        return API.groups().createGroup(group, session, API).then(() => {
            return expect(createWorkFlowGroup).toHaveBeenCalledTimes(1);
        });
    });

    it("Should_FailToCreateGroupLocally_IfGroupFailsToCreateOnProcessMaker", () => {
        ProcessAPI.request = jest.fn().mockImplementation(() => {
            return Promise.reject({error: ""})
        });
        let group = {
            "name": "GroupMe",
            "short_name": "GM",
            "type": "technical"
        };
        const MapperFactory = require('../core/factory/MapperFactory');
        const GroupMapper = MapperFactory.build(MapperFactory.GROUP);

        const createDomainMock = jest.spyOn(GroupMapper, 'createDomainRecord');
        return API.groups().createGroup(group, session, API).catch(err => {
            return expect(createDomainMock).not.toHaveBeenCalled();
        });
    });

    it("Should trigger LinkGroup when the parent key is specified", () => {
        ProcessAPI.request = jest.fn().mockImplementation(() => {
            return Promise.resolve({grp_uid: "wfcases"})
        });
        let group = {
            name: "GroupMe",
            short_name: "GM",
            type: "technical",
            parent: 2
        };
        const linkGroupMock = jest.spyOn(API.groups(), "linkGroup");
        return API.groups().createGroup(group, session, API).then(() => {
            const obj = {parent_id: 2, child_id: 1};
            return expect(linkGroupMock).toHaveBeenCalledWith(obj, session);
        });
    });
});


describe("Update Groups", () => {

    beforeAll(() => {
        tracker.on('query', query => {
            if (query.method === 'update' && query.sql.indexOf('update `group_subs`') !== -1) {
                return query.response([{}]);
            }
        });
    });

    it("UpdateGroup should be defined", async () => {
        return expect(API.groups().updateGroup(1)).rejects.toBeDefined();
    });

    it("UpdateGroup should create a group when mandatory fields are specified", () => {
        return expect(API.groups().updateGroup(1, {name: "Root"}, session, API)).resolves.toMatchObject({
            code: 200,
            data: {
                data: {
                    id: 1,
                    name: "Root"
                }
            }
        });
    });

    it("UpdateGroup should updateGroup on process maker", () => {
        const pmUpdateGroupMock = jest.spyOn(API.workflows(), "updateGroup");
        return API.groups().updateGroup(1, {name: "Root"}, session, API).then(() => {
            return expect(pmUpdateGroupMock).toHaveBeenCalled();
        });
    });

    it("UpdateGroup should update the parent when the parent key is specified", () => {
        const pmUpdateGroupMock = jest.spyOn(API.workflows(), "updateGroup");
        return API.groups().updateGroup(1, {name: "Root"}, session, API).then(() => {
            return expect(pmUpdateGroupMock).toHaveBeenCalled();
        });
    });
});


describe("Linking Groups", () => {

    beforeAll(() => {
        tracker.on('query', query => {
            if (query.method === "insert") {
                return query.response([1, {
                    fieldCount: 0,
                    affectedRows: 1,
                }]);
            }
            query.response([{}]);
        });
    });


    it("LinkGroup Should fail when parent_id and the child_id are equal", () => {
        return expect(API.groups().linkGroup({parent_id: 1, child_id: 1}, session)).rejects.toMatchObject({
            code: 400,
            err: {
                data: "parent_id and child_id cannot be the same"
            }
        });
    });

    it("LinkGroup Should fail when mandatory fields are missing", () => {
        return expect(API.groups().linkGroup({parent_: 1, child_: 1}, session)).rejects.toMatchObject({
            code: 400,
            err: {
                data: {
                    child_id: ["The child id field is required."]
                }
            }
        });
    });


    it("LinkGroup should pass when mandatory field are given", () => {
        return expect(API.groups().linkGroup({parent_id: 1, child_id: 2}, session)).resolves.toMatchObject({
            code: 200,
            data: {
                data: [
                    {"child_group_id": 2, parent_group_id: 1}
                ]
            }
        });
    });

});

describe("Add and Update User Groups:user_groups", () => {

    beforeAll(() => {
        tracker.on('query', query => {
            if (query.sql === 'select `wf_user_id` from `users` where `id` = ?') {
                return query.response([{
                    id: 1,
                    username: "paulex",
                    wf_user_id: "something"
                }]);
            }
        });
    });

    it("AddUserToGroup should fail when mandatory fields are missing", () => {
        return expect(API.groups().addUserToGroup({}, session, API)).rejects.toMatchObject({
            code: 400,
            err: {
                code: "VALIDATION_ERROR",
                data: {
                    "group_id": ["The group id field is required."],
                    "user_id": ["The user id field is required."],
                }
            }
        });
    });

    it("AddUserToGroup should pass with mandatory fields", () => {
        return expect(API.groups().addUserToGroup({user_id: 1, group_id: 1}, session, API)).resolves.toMatchObject({
            code: 200,
            data: {
                data: {
                    "group_id": 1,
                    "user_id": 1
                }
            }
        });
    });

    it("AddUserToGroup should attempt to add AddUserToTheGroup in process maker", () => {
        const pmAddUserToGroupMock = jest.spyOn(API.workflows(), "addUserToGroup");
        return API.groups().addUserToGroup({
            user_id: 1,
            group_id: 1,
            wf_user_id: "dfdfsfdf"
        }, session, API).then(res => {
            expect(res).toMatchObject({
                code: 200,
                data: {
                    data: {
                        "group_id": 1,
                        "user_id": 1,
                        "wf_user_id": "dfdfsfdf"
                    }
                }
            });
            return expect(pmAddUserToGroupMock).toHaveBeenCalled();
        });
    });

    it("UpdateUserGroup should be true when the oldGroup is same as the new Group", () => {
        return expect(API.groups().updateUserGroup(1, 1, {group_id: 1}, session, API)).resolves.toBeTruthy()
    });

    it("UpdateUserGroup should pass when required arguments are given", () => {
        return expect(API.groups().updateUserGroup(1, 2, {group_id: 1}, session, API)).resolves.toBeTruthy()
    });

    it("UpdateGroup should removeUserFromGroup and addUserToGroup on process maker", () => {
        const pmRemoveUserFromGroupMock = jest.spyOn(API.workflows(), 'removeUserFromGroup');
        const pmAddUserToGroupMock = jest.spyOn(API.workflows(), 'addUserToGroup');
        return API.groups().updateUserGroup(1, 2, {group_id: 1}, session, API).then(res => {
            expect(res).toBeTruthy();
            expect(pmRemoveUserFromGroupMock).toHaveBeenCalled();
            return expect(pmAddUserToGroupMock).toHaveBeenCalled();
        });
    })

});

describe("GetGroups", () => {

    beforeAll(() => {
        tracker.on('query', query => {
            if (query.sql.indexOf('from `groups` where') !== -1) {
                return query.response([{
                    id: 1,
                    name: "Abule-Egba-BU",
                    type: "business_unit",
                    short_name: "ABL"
                }])
            }
        });
    });

    it("GetGroup should return a list containing a single group", () => {
        return expect(API.groups().getGroup(1, 'id', session)).resolves.toMatchObject({
            code: 200,
            data: {
                data: {
                    items: [{
                        id: 1,
                        name: "Abule-Egba-BU",
                        type: "business_unit",
                        short_name: "ABL"
                    }]
                }
            }
        })
    });

    it("GetGroups should get a list of groups", async () => {
        return expect(API.groups().getGroups({type: "business_unit"})).resolves.toMatchObject({
            code: expect.any(Number),
            data: {
                data: {
                    items: [{
                        id: 1,
                        name: 'Abule-Egba-BU',
                        type: expect.stringMatching("business_unit"),
                        short_name: 'ABL'
                    }]
                }
            }
        });
    });

    it("GetGroupChildren should return an group object with ids and items", async () => {
        return expect(API.groups().getGroupChildren(1)).resolves.toMatchObject({
            code: 200,
            data: {
                data: {
                    ids: expect.any(Array),
                    items: expect.any(Array)
                }
            }
        });
    });

    it("Test that you can get all users of a group", () => {
        return expect(API.groups().getGroupUsers(1)).resolves.toBeInstanceOf(Array);
    });
});


describe("Groups DataTable", ()=>{
    it("GetGroupTableRecords should fetch group records in dataTable format", ()=>{
        return expect(API.groups().getGroupTableRecords({}, session)).resolves.toMatchObject({
            data:expect.any(Array)
        });
    });
});
