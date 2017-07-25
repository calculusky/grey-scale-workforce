/**
 * Created by paulex on 7/11/17.
 */

const API = require('../API');
var request = "";
// beforeAll(()=> {
//
//     return API.users().createUser({
//         email: "manager22222@gmail.com",
//         username: "manager",
//         password: "admin",
//         first_name: "manager",
//         last_name: "manager",
//         middle_name: "Ugo",
//         gender: "M",
//         api_instance_id: 1
//     }, {api: 1})
//         .then(data=> {
//             var user = data.data.data;
//             return API.staffs().createStaff({
//                 user_id: user.id,
//                 emp_no: "111",
//                 birth_date: "1992-01-10",
//                 api_instance_id: 1
//             }, {api: 1})
//                 .then(data=> {
//                     var staff = data.data.data;
//                     return API.travels().createTravelRequest({
//                         "staff_id": staff.id,
//                         "manager_id": staff.id,
//                         "arrangements": "Flight",
//                         "reasons": "No Reason",
//                         "departure_city": "Lagos",
//                         "arrival_city": "Jos",
//                         "departure_date": "2017-07-11 03:02:13",
//                         "return_date": "2017-07-11 03:02:13"
//                     }, {api: 1})
//                         .then(data=> {
//                             request = data.data.data;
//                             console.log(data);
//                             console.log("Created DATa");
//                         }).catch(err=> {
//                         console.log(staff);
//                         console.log(err);
//                     });
//                 });
//         });
// });

// beforeAll(()=> {
//    
//    
// });

// it("Should resolve without an input", ()=> {
//     return expect(API.travels().getTravelRequests()).resolves.toBeDefined();
// });
//
// it("Should return a user object", ()=> {
//     return expect(API.travels().getTravelRequests(request.id)).resolves.toEqual({
//         data: {
//             status: "success",
//             data: {
//                 items: expect.any(Array)
//             }
//         },
//         code: 200
//     });
// });

describe("Test to see that the validation is done", ()=> {
    it("should return some bad format fields", ()=> {
        return expect(API.travels().createTravelRequest({
            staff_id: "TEST",
            manager_id: "TEST"
        }, {api: 1})).rejects.toEqual({
            "code": 400,
            "err": {
                "data": {"message": "I was expecting number and you gave me string in staff_id"}, "status": "fail"
            }
        });
    });
});


// afterAll(()=> {
//     API.travels().deleteTravelRequest("reasons", "No Reason")
//         .then(()=> {
//             API.staffs().deleteStaff("emp_no", "111").then(()=> {
//                 API.users().deleteUser("username", "manager");
//             });
//         });
// });