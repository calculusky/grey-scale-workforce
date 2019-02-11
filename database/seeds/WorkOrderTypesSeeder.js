
exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('work_order_types').del()
    .then(function () {
      // Inserts seed entries
      return knex('work_order_types').insert([
        {name: 'Disconnections'},
        {name: 'Re-connections'},
        {name: 'Faults'}
    ]
    );
    });
};
