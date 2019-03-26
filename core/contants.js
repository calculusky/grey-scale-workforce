//modules statuses

const constants = {
    statuses:{
        "DW": {
            "2": {
                "id": 2,
                "name": "New",
                "type": "DW",
                "comments": []
            },
            "3": {
                "id": 3,
                "name": "Closed",
                "type": "DW",
                "comments": []
            }
        },
        "Main": {
            "1": {
                "id": 1,
                "name": "Parent",
                "type": "Main",
                "comments": []
            }
        }
    }
};
Reflect.preventExtensions(constants);

module.exports = constants;