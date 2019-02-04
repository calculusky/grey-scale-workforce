/**
 * Created by paulex on 7/7/17.
 */
// const Mapper = require('../core/model/ModelMapper');

const [API, ctx] = require('../index').test();
const UserMapper = require('../modules/Users/model/mappers/UserMapper');
const FaultMapper = require('../modules/Faults/model/mappers/FaultMapper');
const modelMapper = new UserMapper(ctx);
const faultMapper = new FaultMapper(ctx);

const globalMock = require('./setup/ApplicationDependency');
/**
 * @param session {Session}
 */
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


it('Test that findDomainRecord is defined', () => {
    expect.assertions(1);
    expect(modelMapper.findDomainRecord({value: "test"})).toBeDefined();
});

it("Should throw error if the mapper primary key isn't set", () => {
    modelMapper.primaryKey = undefined;
    expect(() => {
        modelMapper.findDomainRecord({});
    }).toThrow(/primary key/);
});

test("If by!=*_all then value must not be null/undefined if null is thrown", () => {
    modelMapper.primaryKey = "somethingKey";
    expect(() => {
        modelMapper.findDomainRecord({});
    }).toThrow(/value must be set/);
});

test("Should throw error if the mapper tableName isn't defined", () => {
    modelMapper.tableName = undefined;
    expect(() => {
        modelMapper.findDomainRecord({value: "someValue"});
    }).toThrow(/override the tableName/);
});

describe('Test Mapper with mock-knex', () => {
    describe('When Querying the database with findDomainRecord', () => {

        beforeAll(() => {
            tracker.on('query', query => {
                query.response([]);
            });
        });

        it("Should retrieve all values if the by==*_all without a where clause", () => {
            modelMapper.tableName = "users";
            expect.assertions(1);
            return modelMapper.findDomainRecord({by: "*_all"})
                .then(({records, query}) => {
                    expect(query).toEqual("select * from `users` where `deleted_at` is null order by `created_at` asc limit 10");
                });
        });

        it("Should retrieve rows based on the where clause", () => {
            modelMapper.tableName = "users";
            expect.assertions(1);
            return modelMapper.findDomainRecord({by: "id", value: 1})
                .then(({records, query}) => {
                    expect(query).toEqual("select * from `users` where `deleted_at` is null and `id` = 1 order by `created_at` asc limit 10");
                });
        });


        it("Should retrieve rows based on where clause with the 'AND' operator", () => {
            modelMapper.tableName = "users";
            expect.assertions(1);
            return modelMapper.findDomainRecord({by: "*_and", value: {"username": "paulex", "first_name": "ade"}})
                .then(({records, query}) => {
                    expect(query).toEqual("select * from `users` where `deleted_at` is null and `username` = 'paulex' and" +
                        " `first_name` = 'ade' order by `created_at` asc limit 10");
                });
        });

        it("Should retrieve rows when search involves json column types", () => {
            faultMapper.tableName = "faults";
            expect.assertions(1);
            return faultMapper.findDomainRecord({
                by: "id", value: {
                    'assigned_to->[]': `'{"id":1}'`,
                    'status': 1
                }
            }).then(({records, query}) => {
                expect(query).toEqual("select * from `faults` where `deleted_at` is null and JSON_CONTAINS(faults.assigned_to, '{\"id\":1}') and `status` = 1 order by `created_at` asc limit 10");
            });
        });

    });

    describe("When Updating the database with updateDomainRecord", () => {

        beforeAll(() => {
            tracker.on('query', query => {
                if (query.method === 'update') {
                    query.response(1);
                }
            });
        });

        it("updateDomainRecord:should update the resource and resolve", () => {
            const User = require('../modules/Users/model/domain-objects/User');
            modelMapper.primaryKey = "id";
            modelMapper.tableName = "users";
            let user = new User({
                email: "donpaul120@gmail.com",
                first_name: "balo"
            });
            return expect(modelMapper.updateDomainRecord({value: 1, domain: user}, session)).resolves.toEqual([{
                id: 1,
                // email: "donpaul120@gmail.com",
                "first_name": "balo",
                updated_at: expect.any(String)
            }, expect.any(Number)]);
        });

    });

    describe('When deleting with deleteDomainRecord', () => {

        beforeAll(() => {
            tracker.on('query', query => {
                if (query.method === 'delete') {
                    console.log(query);
                    query.response(1);
                }
            });
        });

        it("deleteDomainRecord:should delete a record from the DB", () => {
            modelMapper.primaryKey = "id";
            modelMapper.tableName = "attachments";
            return expect(modelMapper.deleteDomainRecord({value: 26}, true, session)).resolves.toEqual([{
                "deleted_at": expect.any(String),
                "id": 26,
                "updated_at": expect.any(String)
            }, 1]);
        });
    })
});

it("should return false if the object keys are empty.", () => {
    const User = require('../modules/Users/model/domain-objects/User');
    expect.assertions(1);
    return modelMapper.createDomainRecord(new User()).catch(response => {
        expect(response).toBeDefined();
    });
});


it("should reject if the required fields for this domain isn't complete.", () => {
    const User = require('../modules/Users/model/domain-objects/User');
    let user = new User({
        password: "adebisi",
        username: "paulex",
        email: "opaul86@yahoo.com"
    });
    expect.assertions(1);
    return expect(modelMapper.createDomainRecord(user)).rejects.toBeDefined();
});


it("updateDomainRecord:Should throw error if the by is undefined", () => {
    modelMapper.primaryKey = undefined;
    expect(() => {
        modelMapper.updateDomainRecord({});
    }).toThrow(/primary key/);
});
//
it("updateDomainRecord:Should throw error if the tableName of this mapper isn't defined", () => {
    modelMapper.primaryKey = "primaryKey";
    modelMapper.tableName = undefined;
    expect(() => {
        modelMapper.updateDomainRecord({});
    }).toThrow(/override the tableName/);
});
//
test("updateDomainRecord:Test That the value parameter is set", () => {
    modelMapper.tableName = "there is a table name now";
    expect(() => {
        modelMapper.updateDomainRecord({});
    }).toThrow("The parameter value must be set for this operation");
});

test("updateDomainRecord:That the domain parameter must be an instance of Domain Object", () => {
    expect(() => {
        modelMapper.updateDomainRecord({value: "AGE", domain: {}});
    }).toThrow("The parameter domainObject must be an instance of DomainObject.");
});

it("updateDomainRecord:should reject if we try to update an object with empty set after guardedValidation", () => {
    const User = require('../modules/Users/model/domain-objects/User');
    let user = new User({
        email: "donpaul120@gmail.com"
    });
    return expect(modelMapper.updateDomainRecord({value: 1, domain: user})).rejects.toBeDefined();
});


//TODO test that BY is a string value

//---------------------------------------------------------------------------------------------------//
it("deleteDomainRecord:should throw error if the primaryKey or the tableName isn't defined", () => {
    modelMapper.primaryKey = undefined;
    modelMapper.tableName = "attachments";
    expect(() => {
        modelMapper.deleteDomainRecord({});
    }).toThrow(/primary key/);


    modelMapper.primaryKey = "id";
    modelMapper.tableName = undefined;
    expect(() => {
        modelMapper.deleteDomainRecord({});
    }).toThrow(/override the tableName/);
});
