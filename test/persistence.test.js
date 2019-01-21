let Persistence = require('../core/persistence/Persistence');


//Test that our persistence can establish a connection
//Test that we can set a value and retrieve the value

describe('Test Suites', () => {
    let persistence;

    beforeAll(() => {
        persistence = new Persistence();
    });

    // expect.assertions(3);
    it("Establish persistence connection", () => {
        expect(persistence.connect()).toBeDefined();
        expect(persistence.connect().getClient()).not.toBeNull();
    });


    it("Set a value in the persistence and retrieve", () => {
        persistence.set("test", "newTest");
        return expect(persistence.get("test")).resolves.toEqual("newTest");
    });

    it("Remove a key from the persistence", ()=>{
        expect(persistence.delete("test")).toEqual(true);
        return expect(persistence.get("test")).resolves.toEqual(null);
    });


});