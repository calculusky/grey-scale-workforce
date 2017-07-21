/**
 * Created by paulex on 7/20/17.
 */
const API = require('../API');

beforeAll(()=> {
    // API.staffs().
});

// it("Should create a staff", ()=> {
//     return expect(API.staffs().createStaff({
//         user_id: 1,
//         emp_no: "1234",
//         birth_date: "2017-07-11",
//         employment_date: "2017-07-11"
//     }, {api: 1})).resolves.toEqual({
//         "status": "success",
//         "data": {
//             "user_id": 1,
//             "emp_no": "1234",
//             "birth_date": "2017-07-11",
//             "employment_date": "2017-07-11"
//         }
//     });
// });

it("should list staff managers", ()=>{
    return API.staffs().getStaffManagers(1, undefined, {api:1})
        .then(({data, code})=>{
            console.log(data.data.items[0]);
            expect(data).toEqual(" ");
        });
});

// it("should list staff departments", ()=>{
//     return expect(API.staffs().getStaffDepartments(1, undefined, {api:1}))
//         .resolves
//         .toEqual({
//             "status": "string",
//             "data": {
//                 "items": [
//                     {
//                         "staff_id": 0,
//                         "emp_no": expect.any(String),
//                         "departments": [
//                             {
//                                 "id": expect.any(Number),
//                                 "name": expect.any(String),
//                                 "code_name": expect.any(String),
//                                 "created_at":expect.anything(),
//                                 "updated_at": expect.anything()
//                             }
//                         ]
//                     }
//                 ]
//             }
//         });
// });