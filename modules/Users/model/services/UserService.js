const DomainFactory = require('../../../DomainFactory');
const MapperFactory = require('../../../MapperFactory');
const Password = require('../../../../core/Utility/Password');
const Util = require('../../../../core/Utility/MapperUtil');
const validate = require('validate-fields')();
/**
 * Created by paulex on 7/4/17.
 */

class UserService {

    constructor() {

    }

    getName() {
        return "userService";
    }

    getUsers(value, by = "id", who = {api: -1}, offset = 0, limit = 10) {
        if (!value || value.trim() == '') {
            //Its important that all queries are streamlined majorly for each business
            value = who.api;
            by = "api_instance_id";
        } else if (value) {
            const temp = value;
            value = {};
            value[by] = temp;
            value['api_instance_id'] = who.api;
            by = "*_and";
        }
        const UserMapper = MapperFactory.build(MapperFactory.USER);
        return UserMapper.findDomainRecord({by, value})
            .then(result=> {
                return (Util.buildResponse({data: {items: result.records}}));
            });
    }

    /**
     *
     * @param body
     * @param who
     */
    createUser(body = {}, who = {}) {
        const User = DomainFactory.build(DomainFactory.USER);
        body['api_instance_id'] = who.api;
        let user = new User(body);

        //enforce the validation
        let isValid = validate(user.rules(), user);
        if(!isValid){
            return Promise.reject(Util.buildResponse({status: "fail", data: {message: validate.lastError}}, 400));
        }
        
        //Get Mapper
        if (user.password) {
            user.setPassword(Password.encrypt(user.password).hash);
        }
        const UserMapper = MapperFactory.build(MapperFactory.USER);
        // console.log(user);
        return UserMapper.createDomainRecord(user).then(user=> {
            if (!user) return Promise.reject();
            delete user.password;
            return Util.buildResponse({data: user});
        });
    }

    /**
     *
     * @param by
     * @param value
     * @returns {*}
     */
    deleteUser(by = "id", value) {
        const UserMapper = MapperFactory.build(MapperFactory.USER);
        return UserMapper.deleteDomainRecord({by, value}).then(count=> {
            if (!count) {
                return Util.buildResponse({status: "fail", data: {message: "The specified record doesn't exist"}});
            }
            return Util.buildResponse({data: {message: "User deleted"}});
        });
    }
}

module.exports = UserService;