const request = require('request');

/**
 * @author Paul Okeke
 * @name ProcessAPI
 *
 * Initialize ProcessAPI
 *
 * @param config
 * @param options
 * @returns {ProcessAPI|*}
 */
exports.init = function (config, options = {autoLogin: false}) {
    this.baseUrl = config.baseUrl;
    this.workSpace = config.workSpace;
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.apiVersion = config.apiVersion;

    //We don't need a slash at the end of the baseUrl
    if (this.baseUrl.charAt(this.baseUrl.length) === '/')
        this.baseUrl = this.baseUrl.substring(0, this.baseUrl.length - 1);

    if (options.autoLogin) {
        this.username = options.username;
        this.password = options.password;
        this.login(this.username, this.password).then();
        return this;
    }
    this.configured = true;
    return this;
};

/**
 * Login to process maker
 *
 * @param username
 * @param password
 * @param options
 * @returns {Promise|*}
 */
exports.login = (username, password, options = {grantType: 'password'}) => {
    console.log("Attempted:Login", this.clientId);
    //TODO test that config details are set, if not throw an error
    const payload = {
        url: `${this.baseUrl}/${this.workSpace}/oauth2/token`,
        json: {
            client_id: this.clientId,
            client_secret: this.clientSecret,
            username, password,
            scope: '*',
            grant_type: options.grantType
        }
    };
    const executor = (resolve, reject) => {
        request.post(payload, (err, res, body) => {
            if (err) return reject(err);//TODO we should actually handle the error here
            //The api should persist the token for the user
            if (res.statusCode !== 200) return reject(body);
            else if (body.error) return reject(body.error);
            console.log(body);
            return (this.token = body) && resolve(this.token);
        });
    };
    return new Promise(executor);
};

/**
 *
 * @param endPoint
 * @param data
 * @param method
 * @param token
 */
exports.request = (endPoint = "", data = {}, method = 'GET', token = null) => {
    // If the token is null, we can retry a re-login
    // but i assume we have to get the username and password --- hmmm
    if (!this.token) {
        //TODO re-authenticate
        console.log("Im not logged-in ooo");
    }

    //Check if the endpoint starts with a slash
    if (endPoint.substring(0, endPoint.length - (endPoint.length - 1)) !== '/') endPoint = `/${endPoint}`;

    //Check the token supplied
    const _token = (token && token['access_token']) ? token['access_token'] : this.token['access_token'];

    if (!_token) throw new Error('You should login to obtain a token first');

    const executor = (resolve, reject) => {
        const options = {
            url: `${this.baseUrl}/api/${this.apiVersion}/${this.workSpace}${endPoint}`,
            headers: {"Authorization": `Bearer ${_token}`},
            json: data,
            timeout: 1500
        };

        switch (method.toUpperCase().trim()) {
            case 'POST':
                options.headers['Content-type'] = "application/json; v=utf-8";
                options.headers['Content-length'] = JSON.stringify(data).length;
                break;
            case 'GET':
                break;
            case 'PUT':
                break;
            case 'DELETE':
                break;
            default:
                throw new TypeError(`HttpMethod: ${method}, is not supported!.`)
        }

        request[method.toLowerCase()](options, (err, res, body) => {
            if (err || ![200, 201, 202].includes(res.statusCode)) {
                return reject(err || body);
            }
            return resolve(body || true);
        });

    };
    return new Promise(executor);
};


/*----------------------------------------------------------
 | The functions below are bonus functions
 |----------------------------------------------------------
 */


/*----------------------------------------------------------
 | Utility for process maker                                |
 |----------------------------------------------------------
 */
exports.Utils = {
    buildCaseVars: function (pro_uid = "", tas_uid = "", ...variables) {
        const data = {pro_uid, tas_uid, variables: []};
        variables.forEach(item => {
            if (item instanceof Object) data.variables.push(item);
        });
        return data;
    }
};

