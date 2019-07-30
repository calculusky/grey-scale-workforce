/**
 * Created by paulex on 9/6/17.
 */
require('dotenv').config();
let [API, ctx] = require('../index').test();
const globalMock = require('./setup/ApplicationDependency');
const Utils = require('../core/Utility/Utils');

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

it('Update Assigned :Old and New', () => {
    return expect(Utils.updateAssigned([{"id": 1}], [{"id": 1}, {id: 1}])).toEqual('[{"id":1}]');
});

// describe("Audit Difference Function", () => {
//     const response = [
//         {
//             "id": 183,
//             "relation_id": 665,
//             "module": "work_orders",
//             "service_name": "workOrders",
//             "activity_type": "create",
//             "model_type": "3",
//             "record": null,
//             "description": "Created a new work_order",
//             "source": null,
//             "source_id": null,
//             "source_name": null,
//             "assigned_to": "[{\"id\": 58, \"created_at\": \"2018-11-07 9:10:40\"}]",
//             "activity_by": 58,
//             "group_id": 1,
//             "ip_address": null,
//             "deleted_at": null,
//             "created_at": "2018-11-07 10:10:40",
//             "updated_at": "2018-11-07 10:10:40"
//         },
//         {
//             "id": 311,
//             "relation_id": 665,
//             "module": "work_orders",
//             "service_name": "workOrders",
//             "activity_type": "update",
//             "model_type": "3",
//             "record": null,
//             "description": "status:2__::::__3",
//             "source": null,
//             "source_id": null,
//             "source_name": null,
//             "assigned_to": "[{\"id\": 47, \"created_at\": \"2018-11-07 18:1:51\"}]",
//             "activity_by": 47,
//             "group_id": 735,
//             "ip_address": null,
//             "deleted_at": null,
//             "created_at": "2018-11-07 18:01:51",
//             "updated_at": "2018-11-07 18:01:51"
//         },
//         {
//             "id": 24321,
//             "relation_id": 665,
//             "module": "faults",
//             "service_name": null,
//             "activity_type": "CREATE",
//             "model_type": "Fault",
//             "record": {"id": 665, "labels": [], "status": "Assigned", "summary": "Red and yellow phase upriser cut", "group_id": 735, "priority": "High", "created_at": "2018-12-20 15:38:20", "created_by": 54, "issue_date": "2018-12-20", "related_to": "assets", "updated_at": "2018-12-20 15:38:20", "assigned_to": [{"id": 54, "created_at": "2018-12-20 15:38:20"}, {"id": 7, "created_at": "2018-12-20 15:38:20"}], "category_id": "LT UPRISER CUT", "relation_id": "25852"},
//             "description": "...",
//             "source": null,
//             "source_id": null,
//             "source_name": null,
//             "assigned_to": [{"id": 54, "created_at": "2018-12-20 15:38:20"}],
//             "activity_by": 54,
//             "group_id": 735,
//             "ip_address": null,
//             "deleted_at": null,
//             "created_at": "2018-12-20 15:38:20",
//             "updated_at": "2018-12-20 15:38:20"
//         },
//         {
//             "id": 24340,
//             "relation_id": 665,
//             "module": "faults",
//             "service_name": null,
//             "activity_type": "UPDATE",
//             "model_type": "Fault",
//             "record": {"id": "665", "status": "/Unknown", "updated_at": "2018-12-20 16:9:13", "completed_date": "2018-12-20 16:9:13"},
//             "description": "...",
//             "source": null,
//             "source_id": null,
//             "source_name": null,
//             "assigned_to": [{"id": 45, "created_at": "2018-12-20 16:9:13"}],
//             "activity_by": 45,
//             "group_id": 735,
//             "ip_address": null,
//             "deleted_at": null,
//             "created_at": "2018-12-20 16:09:13",
//             "updated_at": "2018-12-20 16:09:13"
//         },
//         {
//             "id": 24341,
//             "relation_id": 665,
//             "module": "faults",
//             "service_name": null,
//             "activity_type": "UPDATE",
//             "model_type": "Fault",
//             "record": {"id": "665", "updated_at": "2018-12-20 16:9:13", "completed_date": "2018-12-20 16:9:13"},
//             "description": "...",
//             "source": null,
//             "source_id": null,
//             "source_name": null,
//             "assigned_to": [{"id": 45, "created_at": "2018-12-20 16:9:14"}],
//             "activity_by": 45,
//             "group_id": 735,
//             "ip_address": null,
//             "deleted_at": null,
//             "created_at": "2018-12-20 16:09:14",
//             "updated_at": "2018-12-20 16:09:14"
//         },
//         {
//             "id": 31122,
//             "relation_id": 665,
//             "module": "work_orders",
//             "service_name": null,
//             "activity_type": "UPDATE",
//             "model_type": "WorkOrder",
//             "record": {"id": "665", "status": "Closed", "summary": "RUPTURED BLUE PLACE J&P", "type_id": "Faults", "group_id": "735", "priority": "Medium", "issue_date": "2018-11-07", "related_to": "faults", "start_date": "2018-11-07 10:07:00", "updated_at": "2019-07-30 18:5:21", "assigned_to": [{"id": 47, "created_at": "2018-11-07 9:10:40"}], "relation_id": "69"},
//             "description": "...",
//             "source": null,
//             "source_id": null,
//             "source_name": null,
//             "assigned_to": [{"id": 1, "created_at": "2019-07-30 18:5:22"}],
//             "activity_by": 1,
//             "group_id": 1,
//             "ip_address": null,
//             "deleted_at": null,
//             "created_at": "2019-07-30 18:05:22",
//             "updated_at": "2019-07-30 18:05:22"
//         },
//         {
//             "id": 31123,
//             "relation_id": 665,
//             "module": "work_orders",
//             "service_name": null,
//             "activity_type": "UPDATE",
//             "model_type": "WorkOrder",
//             "record": {"id": "665", "type_id": "Faults", "updated_at": "2019-07-30 18:5:22", "completed_date": "2019-07-30 18:5:22"},
//             "description": "...",
//             "source": null,
//             "source_id": null,
//             "source_name": null,
//             "assigned_to": [{"id": 1, "created_at": "2019-07-30 18:5:22"}],
//             "activity_by": 1,
//             "group_id": 1,
//             "ip_address": null,
//             "deleted_at": null,
//             "created_at": "2019-07-30 18:05:22",
//             "updated_at": "2019-07-30 18:05:22"
//         }
//     ];
//
//     it("auditDifference: Should return a correct record trail", () => {
//         return expect(Utils.auditDifference(response)).toEqual(expect.arrayContaining([
//             {
//                 by: 1,
//                 event_time: '2019-07-30 18:05:22',
//                 event_type: 'UPDATE',
//                 field_name: 'completed_date',
//                 field_value: '2019-07-30 18:5:22',
//                 old_value: '2018-12-20 16:9:13'
//             }
//         ]))
//     })
//
// });


it("Test Date functions", ()=>{
    const moment = require('moment');
    return expect(moment('2019-07-30T19:36:14.000Z').utc().format('YYYY-MM-DD H:m:s')).toEqual('2019-07-30 19:36:14');
});
//
//
// it("isJson with empty string", () => {
//   expect(Utils.isJson("")[0]).toEqual(false);
// });
//
// it("isJson with bad json format", () => {
//     expect(Utils.isJson()[0]).toEqual(false);
// });
//
// it("isJson with a valid", () => {
//     expect(Utils.isJson("["holyspirit","broken","mobile"]")[0]).toEqual(true);
// });
//
// it("isJson with a valid", () => {
//     expect(Utils.isJson(["abc"])[0]).toEqual(true);
// });
//
// it("Test that we can retrieve address by supplying location points", () => {
//     return expect(Utils.getAddressFromPoint(6.4718342, 3.5741831)).resolves.toEqual(true);
// });
//
// it("Testing password reset", ()=>{
//     const Password = require('../core/Utility/Password');
//     const encrypted = Password.encrypt("92c5a7dc4535b2ea326a9f4ef5e6735c5d1ed59a4ad7d22d0679f69bf3898a95").hash.replace("$2a$", "$2y$");
//     return expect(encrypted).toEqual("");
// });
//
//
// it("Test spot the difference between two objects", () => {
//     return expect(Utils.difference(
//         {"id": 5, "email": "03balogun@gmail.com", "gender": "M", "group_id": 1, "password": "$2b$10$g1S0W2UFTyIjVjoeEAyTGu5ePSchAYB1Mj0ZL3fjTB7dCVgOe4VXu", "username": "cco_user", "last_name": "Test", "mobile_no": "08131174231", "user_type": "admin", "created_at": "2018-11-21 18:57:41", "created_by": 1, "first_name": "IE CCO_USER", "updated_at": "2018-11-21 18:57:41", "wf_user_id": "2651028885bf59c95502129044733979", "assigned_to": "[{"id":1,"created_at":"2018-11-21 18:57:40"}]", "wf_user_pass": "8e452dd478fe6739f0ad2d9dfc8a22e9", "firebase_token": "[]"},
//         {"id": 5, "deleted_at": "2018-11-21 18:57:41", "updated_at": "2018-11-21 18:57:41"}))
//         .resolves.toEqual(true);
// });
