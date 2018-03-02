let API = require('../API');

const config = require('../config.json');
const Context = require('../core/Context');
API = new API(new Context(config));

it("Activation activateUser should be defined", () => {
    return expect(API.activations().activateUser(1)).toBeDefined();
});

test("Activation should resolve", () => {
    return expect(API.activations().activateUser(1)).resolves.toEqual(expect.objectContaining({
        code: expect.any(String)
    }));
});