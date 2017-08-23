/**
 * Created by paulex on 7/20/17.
 */
const RelationShips = require('../core/model/links/Relationships');
const Fault = require('../modules/Faults/model/domain-objects/Fault');

// test("belongsToMany Should be defined", ()=>{
//     let relationship = new RelationShips();
//     expect(relationship.belongsToMany("Department")).toBeDefined();
// });

// test("belongsToMany Should be defined", ()=>{
//     let staff = new Staff({id:1});
//     expect(staff.departments()).resolves.toEqual({});
// });


// test("belongsToMany Relationship should throw error if the domainMapper doesn't exist", ()=> {
//     let staff = new Staff({id: 1});
//     staff.departments = ()=> {
//         return staff.relations().belongsToMany("Nothing");
//     };
//     expect(()=> {
//         staff.departments().then(r=> {
//
//         });
//     }).toThrow("Domain Mapper for Nothing cannot be found.");
// });
//
// test("belongsToMany Should return appropriate row count", ()=> {
//     let staff = new Staff({id: 1});
//     return staff.departments().then(res=> {
//         let departments = res.records;
//         let department = departments[0];
//         return department.managers().then(result=> {
//             expect(result.records.length).toEqual(1);
//         });
//     });
// });
//
// test("belongsToMany Relationship should return related info", ()=> {
//     let staff = new Staff({id: 1});
//     return staff.departments().then(res=> {
//         expect(res.records).toEqual([
//             {
//                 id: 1,
//                 name: "Procurement",
//                 code_name: "PRC",
//                 api_instance_id: expect.any(Number),
//                 created_at: expect.anything(),
//                 updated_at: expect.anything()
//             }
//         ]);
//     });
// });

test("belongsTo Relationship should return related  info", ()=>{
    let fault = new Fault({id:1, assigned_to:3});
    return fault.user().then(res=>{
        expect(res.records).toBeDefined()
    })
});


test("morphMany Relationship should resolve", ()=>{
    let fault = new Fault({id:1, assigned_to:3});
    return fault.notes().then(res=>{
        expect(res.records).toBeDefined();
    })
});


