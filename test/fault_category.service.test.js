/**
 * Created by paulex on 9/6/17.
 */
const API = require('../index').test();

// const Utils = require('../core/Utility/Utils');


test('Testlar', () => {
    API.faultCategories().getFaultCategories({type: "LT FAULT"}).then(d => {
        expect(d).toEqual({});
    });
});
