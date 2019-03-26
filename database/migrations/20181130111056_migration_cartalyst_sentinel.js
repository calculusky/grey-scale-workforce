exports.up = function(knex, Promise) {

    return knex.schema.createTable('activations', function (table) {
        table.increments('id');
        table.integer('user_id').unsigned();
        table.string('code');
        table.boolean('completed').default(0);
        table.timestamp('completed_at').nullable();
        table.timestamps();

        table.engine = 'InnoDB';
    })

        .createTable('persistences', function (table) {
            table.increments('id');
            table.integer('user_id').unsigned();
            table.string('code');
            table.timestamps();

            table.engine = 'InnoDB';
            table.unique('code');
        })

        .createTable('reminders', function (table) {
            table.increments('id');
            table.integer('user_id').unsigned();
            table.string('code');
            table.boolean('completed').default(0);
            table.timestamp('completed_at').nullable();
            table.timestamps();

            table.engine = 'InnoDB';
        })

        .createTable('roles', function (table) {
            table.increments('id');
            table.string('slug');
            table.string('name');
            table.json('permissions').nullable();
            table.json("assigned_to").nullable();
            table.integer("group_id").unsigned().nullable();
            table.timestamp('deleted_at').nullable();
            table.integer("created_by").unsigned().nullable();
            table.integer("deleted_by").unsigned().nullable();
            table.timestamps();

            table.foreign("group_id").references("id").on("groups");
            table.engine = 'InnoDB';
            table.unique('slug');
        })

        .createTable('role_users', function (table) {
            table.integer('user_id').unsigned();
            table.integer('role_id').unsigned();
            table.timestamps();

            table.engine = 'InnoDB';
            table.primary(['user_id', 'role_id']);
        })

        .createTable('user_groups', function (table) {
            table.integer('user_id').unsigned();
            table.integer('group_id').unsigned();
            table.timestamps();

            table.engine = 'InnoDB';
            table.primary(['user_id', 'group_id']);
        })

        .createTable('throttle', function (table) {
            table.increments('id');
            table.integer('user_id').unsigned().nullable();
            table.string('type');
            table.string('ip').nullable();
            table.timestamps();
            table.engine = 'InnoDB';
            table.index('user_id');
        })

        .createTable('users', function (table) {
            table.increments('id');
            table.string('username').unique();
            table.string('email');
            table.string('password');
            table.string('first_name').nullable();
            table.string('last_name').nullable();
            table.string('middle_name').nullable();
            table.string('gender');
            table.string('mobile_no').nullable();
            table.string('alt_mobile_no').nullable();
            table.string('user_type').default("regular");
            table.string('avatar').nullable();
            table.text('permissions').nullable();
            table.json("fire_base_token").nullable();
            table.integer("address_id").unsigned().nullable();
            table.timestamp('last_login').nullable();
            table.string("wf_user_id").nullable();
            table.string("wf_user_pass").nullable();
            table.json("assigned_to").nullable();
            table.integer("created_by").unsigned().nullable();
            table.integer("deleted_by").unsigned().nullable();
            table.integer("group_id").unsigned().nullable();
            table.specificType('location', 'POINT').nullable();
            // table.softDeletes();
            table.timestamp('deleted_at').nullable();
            table.timestamps();
            table.unique('email');

            table.foreign("created_by").references("id").on("users");
            table.foreign("deleted_by").references("id").on("users");
            table.foreign("group_id").references("id").on("groups");
            table.foreign("address_id").references("id").on("addresses");
            table.engine = 'InnoDB';
        })

        .alterTable('roles', (t) => {
            t.foreign("created_by").references("id").on("users");
        })
        .alterTable('roles', (t) => {
            t.foreign("deleted_by").references("id").on("users");
        })
        .alterTable('groups', (t) => {
            t.foreign("created_by").references("id").on("users");
        });

    // db.statement('ALTER TABLE roles ADD CONSTRAINT `roles_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)');
    // db.statement('ALTER TABLE `groups` ADD CONSTRAINT groups_created_by_foreign FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)');
};

exports.down = function(knex, Promise) {

    return knex.schema.dropTable('activations', 'persistences', 'reminders', 'roles', 'role_users', 'throttle', 'users');

};
