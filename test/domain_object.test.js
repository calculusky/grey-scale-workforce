const [API, ctx] = require('../index').test();
const globalMock = require('./setup/ApplicationDependency');
const User = require('../modules/Users/model/domain-objects/User');


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

describe("Update Assigned To", ()=>{

    it("updateAssignedTo should update and format the assigned_to field", ()=>{
        const user = new User({
            id:1,
            username:"paulex10",
            assigned_to:[1,2,4]
        });
        user.updateAssignedTo([{id:1, created_at:""}]);
        return expect(JSON.parse(user.assigned_to)).toMatchObject([
            {id:1, created_at:expect.any(String)},
            {id:2, created_at:expect.any(String)},
            {id:4, created_at:expect.any(String)},
        ]);
    });

    it("UpdateAssignedTo should accept an array string", ()=>{
        const user = new User({
            id:1,
            username:"paulex10",
            assigned_to:'["1", "2", "4"]'
        });
        user.updateAssignedTo([{id:1, created_at:""}]);
        return expect(JSON.parse(user.assigned_to)).toMatchObject([
            {id:1, created_at:expect.any(String)},
            {id:2, created_at:expect.any(String)},
            {id:4, created_at:expect.any(String)},
        ]);
    });

    it("UpdateAssignedTo should pass when the assigned_to value contains a single value", ()=>{
        const user = new User({
            id:1,
            username:"paulex10",
            assigned_to:'1'
        });
        user.updateAssignedTo([{id:2, created_at:""}, {id:4, created_at:""}]);
        return expect(JSON.parse(user.assigned_to)).toMatchObject([
            {id:2, created_at:expect.any(String)},
            {id:4, created_at:expect.any(String)},
            {id:1, created_at:expect.any(String)}
        ]);
    });

    it("UpdateAssignedTo should remove an assigned user from previous assigned to", ()=>{
        const user = new User({
            id:1,
            username:"paulex10",
            assigned_to:'["2", "4"]'
        });
        user.updateAssignedTo([{id:1, created_at:""}, {id:2, created_at:""}, {id:4, created_at:""}]);
        return expect(JSON.parse(user.assigned_to)).toMatchObject([
            {id:2, created_at:expect.any(String)},
            {id:4, created_at:expect.any(String)},
        ]);
    });

    it("UpdateAssignedTo should do nothing when assigned_to value is empty", ()=>{
        const user = new User({
            id:1,
            username:"paulex10",
        });
        user.updateAssignedTo([{id:1, created_at:""}, {id:2, created_at:""}, {id:4, created_at:""}]);
        return expect(()=>{
            JSON.parse(user.assigned_to)
        }).toThrow();
    });

});
