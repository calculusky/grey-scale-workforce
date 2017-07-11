/**
 * Created by paulex on 7/8/17.
 */
const User = require('../modules/Users/model/domain-objects/User');

it("Should have this fields as attributes on the domain object", ()=> {
    expect(new User({address_id: "33"})).toEqual({
        address_id: "33"
    });
});

it("Should convert the client data to its table data", ()=> {
    let user = new User({address_id: "33"});
    expect(user.serialize()).toEqual({
        add_id: "33"
    });
});

it("Should convert the db data to its client data", ()=> {
    let user = new User();
    expect(user.serialize({add_id: 33}, "client")).toEqual({
        address_id: 33
    });
});