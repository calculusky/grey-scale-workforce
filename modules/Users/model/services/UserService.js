const DomainFactory = require('../../../DomainFactory');
const MapperFactory = require('../../../MapperFactory');
/**
 * Created by paulex on 7/4/17.
 */

class UserService {

    constructor() {

    }

    getName() {
        return "userService";
    }

    /**
     * @param username
     * @param password
     */
    loginUser(username = "", password = "") {
        //TEST that username and password aren't empty
        let executor = (resolve, reject)=> {
            if ((!username && username == "") || (!password && password == "")) {
                return reject("Username and Password cannot be empty");
            }
            let UserMapper = MapperFactory.build(MapperFactory.USER);

            let user = UserMapper.findUser("usr_username", username);

            if (user.usr_password == password) {
                return resolve({
                    usr_username: user.usr_username,
                    token: "ThisIsATestToken",
                    date: Date.now()
                });
            } else {
                return reject("Invalid Username or Password");
            }
        };
        return new Promise(executor);
    }

    logoutUser(username, sessionId) {

    }


    createUser(body) {

    }


    getUser(value, by = "usr_id") {
        let executor = (resolve, reject)=> {
            let UserMapper = MapperFactory.build(MapperFactory.USER);
            let user = UserMapper.findUser(by, value);
            if (!user) return resolve("User not found");

            return resolve(user);
        };
        return new Promise(executor);
    }

}

module.exports = UserService;