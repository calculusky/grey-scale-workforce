/**
 * Created by paulex on 7/7/17.
 */
// const Mapper = require('../core/model/ModelMapper');

const UserMapper = require('../modules/Users/model/mappers/UserMapper');
const modelMapper = new UserMapper();

it('Test that findDomainRecord is defined', ()=> {
    expect.assertions(1);
    expect(modelMapper.findDomainRecord({value: "test"})).toBeDefined();
});

it("Should throw error if the mapper primary key isn't set", ()=> {
    modelMapper.primaryKey = undefined;
    expect(()=> {
        modelMapper.findDomainRecord({});
    }).toThrow(/primary key/);
});

test("If by!=*_all then value must not be null/undefined if null is thrown", ()=> {
    modelMapper.primaryKey = "somethingKey";
    expect(()=> {
        modelMapper.findDomainRecord({});
    }).toThrow(/value must be set/);
});

test("Should throw error if the mapper tableName isn't defined", ()=> {
    modelMapper.tableName = undefined;
    expect(()=> {
        modelMapper.findDomainRecord({value: "someValue"});
    }).toThrow(/override the tableName/);
});

it("Should retrieve all values if the by==*_all without a where clause", ()=> {
    modelMapper.tableName = "users";
    expect.assertions(1);
    return modelMapper.findDomainRecord({by: "*_all"})
        .then(({records, query})=> {
            expect(query).toEqual("select * from `users` limit 10");
        });
});

it("Should retrieve rows based on the where clause", ()=> {
    modelMapper.tableName = "users";
    expect.assertions(1);
    return modelMapper.findDomainRecord({by: "id", value: 1})
        .then(({records, query})=> {
            expect(query).toEqual("select * from `users` where `usr_id` = 1 limit 10");
        });
});

it("Should retrieve rows based on where clause with the 'AND' operator", ()=> {
    modelMapper.tableName = "users";
    expect.assertions(1);
    return modelMapper.findDomainRecord({by: "*_and", value: {"first_name": "ade", "username": "paulex"}})
        .then(({records, query})=> {
            expect(query).toEqual("select * from `users` where `usr_username` = 'paulex' and" +
                " `usr_first_name` = 'ade' limit 10");
        });
});

it("Should throw error if the domainObject args isn't an instance of DomainObject", ()=> {
    expect(()=> {
        modelMapper.createDomainRecord({});
    }).toThrow("The parameter domainObject must be an instance of DomainObject.");
});

it("should return false if the object keys are empty.", ()=> {
    const User = require('../modules/Users/model/domain-objects/User');
    expect.assertions(1);
    return modelMapper.createDomainRecord(new User()).catch(response=>{
        expect(response).toBeDefined();
    });
});


it("should reject if the required fields for this domain isn't complete.", ()=> {
    const User = require('../modules/Users/model/domain-objects/User');
    let user = new User({
        username: "paulex",
        password: "adebisi",
        email: "opaul86@yahoo.com"
    });
    expect.assertions(1);
    return expect(modelMapper.createDomainRecord(user)).rejects.toBeDefined();
});

// it("should reject if the required fields for this domain isn't complete.", ()=> {
//     const User = require('../modules/Users/model/domain-objects/User');
//     let user = new User({
//         username: "paulex",
//         password: "adebisi",
//         email:"opaul86@yahoo.com",
//         first_name:"Paul",
//         last_name:"Okeke",
//         middle_name:"Ugo",
//         gender:"M",
//         api_instance_id:1
//     });
//     expect.assertions(1);
//     return expect(modelMapper.createDomainRecord(user)).rejects.toBeDefined();
// });


it("updateDomainRecord:Should throw error if the by is undefined", ()=> {
    modelMapper.primaryKey = undefined;
    expect(()=> {
        modelMapper.updateDomainRecord({});
    }).toThrow(/primary key/);
});

it("updateDomainRecord:Should throw error if the tableName of this mapper isn't defined", ()=> {
    modelMapper.primaryKey = "primaryKey";
    modelMapper.tableName = undefined;
    expect(()=> {
        modelMapper.updateDomainRecord({});
    }).toThrow(/override the tableName/);
});

test("updateDomainRecord:That the value parameter is set", ()=> {
    modelMapper.tableName = "there is a table name now";
    expect(()=> {
        modelMapper.updateDomainRecord({});
    }).toThrow("The parameter value must be set for this operation");
});

test("updateDomainRecord:That the domain parameter must be an instance of Domain Object", ()=> {
    expect(()=> {
        modelMapper.updateDomainRecord({value: "AGE", domain: {}});
    }).toThrow("The parameter domainObject must be an instance of DomainObject.");
});

it("updateDomainRecord:should reject if we try to update an object with empty set after guardedValidation", ()=> {
    const User = require('../modules/Users/model/domain-objects/User');
    let user = new User({
        email: "donpaul120@gmail.com"
    });
    return expect(modelMapper.updateDomainRecord({value: 1, domain: user})).rejects.toBeDefined();
});

it("updateDomainRecord:should Resolve and update the resource", ()=> {
    const User = require('../modules/Users/model/domain-objects/User');
    modelMapper.primaryKey = "id";
    modelMapper.tableName = "users";
    let user = new User({
        email: "donpaul120@gmail.com",
        first_name: "balo"
    });
    return expect(modelMapper.updateDomainRecord({value: 3, domain: user})).resolves.toEqual([{
        "first_name": "balo"
    }, 1]);
});

//TODO test that BY is a string value

//---------------------------------------------------------------------------------------------------//
it("deleteDomainRecord:should throw error if the primaryKey or the tableName isn't defined", ()=> {
    modelMapper.primaryKey = undefined;
    modelMapper.tableName = "users";
    expect(()=> {
        modelMapper.deleteDomainRecord({});
    }).toThrow(/primary key/);


    modelMapper.primaryKey = "id";
    modelMapper.tableName = undefined;
    expect(()=> {
        modelMapper.deleteDomainRecord({});
    }).toThrow(/override the tableName/);
});

it("deleteDomainRecord:should delete a record from the DB", ()=>{
    modelMapper.primaryKey = "id";
    modelMapper.tableName = "users";
    expect(modelMapper.deleteDomainRecord({value:3})).resolves.toEqual(1);
});


it('', ()=>{
    
});