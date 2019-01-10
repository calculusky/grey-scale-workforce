
exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('asset_types').del()
    .then(function () {
      // Inserts seed entries
      return knex('asset_types').insert([
        {id: 1, name: 'Injection Substation'},
        {id: 2, name: '11 KV Feeder'},
        {id: 3, name: '33 KV Feeder'},
        {id: 4, name: 'Distribution Transformer'}
      ]);
    });
};


