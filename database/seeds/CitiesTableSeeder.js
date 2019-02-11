
exports.seed = function(knex, Promise) {
    // Deletes ALL existing entries


    const data = [
        {state_id:500,name : 'Bauchi', created_at : '2017-08-19 21:46:27', updated_at : '2017-08-21 20:54:35'},
        {state_id:500,name : 'Kaduna', created_at : '2017-08-19 22:27:42', updated_at : '2017-08-21 13:43:06'},
        {state_id:500,name : 'Delta', created_at : '2017-08-19 00:46:10', updated_at : '2017-08-21 21:21:27'},
        {state_id:500,name : 'Delta', created_at : '2017-08-19 08:20:11', updated_at : '2017-08-21 14:20:45'},
        {state_id:500,name : 'Niger', created_at : '2017-08-19 22:30:24', updated_at : '2017-08-21 02:14:02'},
        {state_id:500,name : 'Rivers', created_at : '2017-08-19 19:43:33', updated_at : '2017-08-21 20:27:49'},
        {state_id:500,name : 'Borno', created_at : '2017-08-19 06:30:57', updated_at : '2017-08-21 17:13:11'},
        {state_id:500,name : 'Anambra', created_at : '2017-08-19 03:13:18', updated_at : '2017-08-21 16:22:38'},
        {state_id:500,name : 'Imo', created_at : '2017-08-19 20:59:00', updated_at : '2017-08-21 06:49:01'},
        {state_id:500,name : 'Oyo', created_at : '2017-08-19 08:18:16', updated_at : '2017-08-21 09:42:59'},
        {state_id:500,name : 'Benue', created_at : '2017-08-19 04:38:30', updated_at : '2017-08-21 01:26:31'},
        {state_id:500,name : 'Ogun', created_at : '2017-08-19 16:58:46', updated_at : '2017-08-21 10:40:53'},
        {state_id:500,name : 'Rivers', created_at : '2017-08-19 05:40:08', updated_at : '2017-08-21 19:01:37'},
        {state_id:500,name : 'Akwa Ibom', created_at : '2017-08-19 03:35:47', updated_at : '2017-08-21 19:37:03'},
        {state_id:500,name : 'Kano', created_at : '2017-08-19 17:06:47', updated_at : '2017-08-21 06:50:07'}
    ];

    return knex('cities').del()
        .then(function () {
            // Inserts seed entries
            return knex('cities').insert(data);
        });
};


