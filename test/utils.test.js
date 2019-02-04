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
//     expect(Utils.isJson("[\"holyspirit\",\"broken\",\"mobile\"]")[0]).toEqual(true);
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
//         {"id": 5, "email": "03balogun@gmail.com", "gender": "M", "group_id": 1, "password": "$2b$10$g1S0W2UFTyIjVjoeEAyTGu5ePSchAYB1Mj0ZL3fjTB7dCVgOe4VXu", "username": "cco_user", "last_name": "Test", "mobile_no": "08131174231", "user_type": "admin", "created_at": "2018-11-21 18:57:41", "created_by": 1, "first_name": "IE CCO_USER", "updated_at": "2018-11-21 18:57:41", "wf_user_id": "2651028885bf59c95502129044733979", "assigned_to": "[{\"id\":1,\"created_at\":\"2018-11-21 18:57:40\"}]", "wf_user_pass": "8e452dd478fe6739f0ad2d9dfc8a22e9", "firebase_token": "[]"},
//         {"id": 5, "deleted_at": "2018-11-21 18:57:41", "updated_at": "2018-11-21 18:57:41"}))
//         .resolves.toEqual(true);
// });
