exports.seed = function(knex, Promise) {
    const data = [
        {
            "id": 1,
            "name": "R2TP",
            "amount": 3000.00,
            "created_at": "2019-10-30 16:22:51",
            "updated_at": "2019-10-30 16:24:13"
        },
        {
            "id": 2,
            "name": "R2SP",
            "amount": 3000.00,
            "created_at": "2019-10-30 16:23:03",
            "updated_at": "2019-10-30 16:24:14"
        },
        {
            "id": 3,
            "name": "C1TP",
            "amount": 6000.00,
            "created_at": "2019-10-30 16:23:07",
            "updated_at": "2019-10-30 16:24:16"
        },
        {
            "id": 4,
            "name": "C1SP",
            "amount": 3000.00,
            "created_at": "2019-10-30 16:23:09",
            "updated_at": "2019-10-30 16:24:17"
        },
        {
            "id": 5,
            "name": "D1",
            "amount": 3000.00,
            "created_at": "2019-10-30 16:23:10",
            "updated_at": "2019-10-30 16:24:19"
        },
        {
            "id": 6,
            "name": "A1SP",
            "amount": 3000.00,
            "created_at": "2019-10-30 16:23:51",
            "updated_at": "2019-10-30 16:24:20"
        },
        {
            "id": 7,
            "name": "A1TP",
            "amount": 3000.00,
            "created_at": "2019-10-30 16:23:53",
            "updated_at": "2019-10-30 16:24:21"
        },
        {
            "id": 8,
            "name": "S1",
            "amount": 3000.00,
            "created_at": "2019-10-30 16:23:54",
            "updated_at": "2019-10-30 16:24:23"
        },
        {
            "id": 9,
            "name": "C2",
            "amount": 15000.00,
            "created_at": "2019-10-30 16:23:55",
            "updated_at": "2019-10-30 16:24:25"
        },
        {
            "id": 10,
            "name": "D2",
            "amount": 3000.00,
            "created_at": "2019-10-30 16:23:57",
            "updated_at": "2019-10-30 16:24:27"
        },
        {
            "id": 11,
            "name": "D3",
            "amount": 3000.00,
            "created_at": "2019-10-30 16:23:58",
            "updated_at": "2019-10-30 16:24:29"
        },
        {
            "id": 12,
            "name": "A2",
            "amount": 3000.00,
            "created_at": "2019-10-30 16:24:00",
            "updated_at": "2019-10-30 16:24:30"
        },
        {
            "id": 13,
            "name": "R3",
            "amount": 3000.00,
            "created_at": "2019-10-30 16:24:02",
            "updated_at": "2019-10-30 16:24:32"
        },
        {
            "id": 14,
            "name": "A3",
            "amount": 3000.00,
            "created_at": "2019-10-30 16:24:03",
            "updated_at": "2019-10-30 16:24:34"
        },
        {
            "id": 15,
            "name": "C3",
            "amount": 3000.00,
            "created_at": "2019-10-30 16:24:05",
            "updated_at": "2019-10-30 16:24:36"
        },
        {
            "id": 16,
            "name": "R4",
            "amount": 3000.00,
            "created_at": "2019-10-30 16:24:06",
            "updated_at": "2019-10-30 16:24:37"
        },
        {
            "id": 17,
            "name": "A1S",
            "amount": 3000.00,
            "created_at": "2019-10-30 16:24:07",
            "updated_at": "2019-10-30 16:24:38"
        },
        {
            "id": 18,
            "name": "A1",
            "amount": 3000.00,
            "created_at": "2019-10-30 16:24:09",
            "updated_at": "2019-10-30 16:24:40"
        },
        {
            "id": 19,
            "name": "R2",
            "amount": 3000.00,
            "created_at": "2019-10-30 16:24:10",
            "updated_at": "2019-10-30 16:24:42"
        }
    ];

    return knex('rc_fees').del().then(() => knex('rc_fees').insert(data));
};
