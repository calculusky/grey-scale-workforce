/**
 * Created by paulex on 7/5/17.
 */


test('Should return an empty object', ()=> {
    "use strict";
    //Es.query().build();
    expect(Es.query().build()).toEqual({});
});