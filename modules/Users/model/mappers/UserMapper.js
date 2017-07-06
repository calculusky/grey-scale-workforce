/**
 * Created by paulex on 7/4/17.
 */

class UserMapper {

    constructor() {
        this.dbStore = [
            {
                usr_id: 1,
                usr_username: "paulex",
                usr_password: "Nigeriasns1",
                usr_first_name: "Paul",
                usr_last_name: "Okeke",
                usr_email: "opaul86@yahoo.com",
                usr_gender: "male",
                usr_created_at: "14-07-2017",
                usr_updated_at: "14-07-2017"
            }
        ];
    }

    createUser() {

    }

    /**
     *
     * @param by
     * @param value
     * @returns {*}
     */
    findUser(by = "id", value) {
        let domain = null;
        this.dbStore.forEach(user=> {
            if (user[by] == value) {
                domain = user;
            }
        });
        return domain;
    }

    addUser(user = null) {
        
    }
}

module.exports = UserMapper;