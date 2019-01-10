
exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries

    const data = [
        {
            name: "Root",
            description: "Master Group",
            type: "root",
            short_name: "root"
        }
    ];

  return knex('groups').del()
    .then(function () {
      // Inserts seed entries
      return knex('groups').insert(data);
    });
};
