/**
 * @type {API}
 */
let API = require('../index').test();
const ProcessAPI = require('../processes/ProcessAPI');

beforeAll(()=>{
    ProcessAPI.init({
        "baseUrl": process.env.PM_BASE_URL,
        "clientId": process.env.PM_CLIENT_ID,
        "clientSecret": process.env.PM_CLIENT_SECRET,
        "workSpace": process.env.PM_WORK_SPACE,
        "apiVersion": process.env.PM_API_VERSION
    });
});

it("Starting a CASE", async () => {
    expect.assertions(1);
    const pmToken =  await ProcessAPI.login("patrick.june@ncdmb.gov.ng", "admin");
    const _fakeWho = {pmToken};
    const _case = await API.workflows().startCase("ncec_renewal", _fakeWho, undefined, "85903946857bebde308d956054864464")
        .catch(console.error);

    const _route = await API.workflows().routeCase(_case, _fakeWho);
    expect(_route).toEqual();
});


it("get all task", async ()=>{
    expect.assertions(1);
    const pmToken =  await ProcessAPI.login("patrick.june@ncdmb.gov.ng", "admin");

    const _fakeWho = {pmToken};
    const _case = await API.workflows().getCase().catch(console.error);
});