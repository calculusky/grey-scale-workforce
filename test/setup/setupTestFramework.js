const iconv = require('iconv-lite');
const encoding = require('iconv-lite/encodings');
iconv.encodings = encoding;

const ProcessAPI = require('../../processes/ProcessAPI');
ProcessAPI.init = jest.fn().mockImplementation(() => {
    ProcessAPI.token = {
        access_token: "dafffaf"
    };
    ProcessAPI.baseUrl = process.env.PM_BASE_URL;
    ProcessAPI.apiVersion = process.env.PM_API_VERSION;
    ProcessAPI.workSpace = process.env.PM_WORK_SPACE;
    return ProcessAPI;
});
ProcessAPI.login = jest.fn().mockImplementation(() => new Promise((resolve, reject) => {
    return resolve("Token");
}));

ProcessAPI.request = jest.fn().mockImplementation(() => Promise.resolve());

