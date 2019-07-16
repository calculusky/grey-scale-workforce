exports.up = function (knex) {
    return knex.schema.createTable('material_categories', function (table) {
        table.increments('id');
        table.string('name', 255).notNullable();
        table.integer('parent_id').nullable();
        table.string('source', 255).nullable();
        table.string('source_id', 200).nullable();
        table.json("assigned_to").nullable();
        table.integer("group_id").unsigned().nullable();
        table.integer("created_by").unsigned().notNullable();
        table.integer("deleted_by").unsigned().nullable();
        table.timestamp('deleted_at').nullable();
        table.timestamps();

        table.unique('name');
        table.foreign("parent_id").references("id").on("material_categories");
        table.foreign("group_id").references("id").on("groups");
        table.foreign("created_by").references("id").on("users");
        table.foreign("deleted_by").references("id").on("users");
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable('material_categories')
};
