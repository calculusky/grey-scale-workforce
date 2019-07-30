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
                "name": "Disconnected",
                "type": "DW",
                "comments": []
            }
        },
        "FW": {
            "1": {
                "id": 1,
                "name": "New",
                "type": "FW",
                "comments": []
            },
            "2": {
                "id": 2,
                "name": "Assigned",
                "type": "FW",
                "comments": []
            },
            "3": {
                "id": 3,
                "name": "Pending",
                "type": "FW",
                "comments": []
            },
            "4": {
                "id": 4,
                "name": "Closed",
                "type": "FW",
                "comments": []
            },
            "8": {
                "id": 8,
                "name": "Canceled",
                "type": "FW",
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