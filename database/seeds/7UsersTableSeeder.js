exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries

    const password = 'admin$$';
    const data = {
        first_name: "Paul",
        gender: 'M',
        group_id: 1,
        last_name: "Okeke",
        email: "admin@admin.com",
        location: (30.2, 34.4),
        username: "admin",
        fire_base_token: [],
        password: password
};

    return knex('user_groups').del()
    .then(function () {
      // Inserts seed entries
      return knex('user_groups').insert([
          {user_id: 1, group_id: 1}
      ]);
    });
};
