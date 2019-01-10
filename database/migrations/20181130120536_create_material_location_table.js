
exports.up = function(knex, Promise) {

    return knex.schema.createTable('material_locations', function (table) {
        table.increments('id');
        table.integer('material_id').unsigned();
        table.integer("group_id").unsigned().nullable();
        table.integer('quantity');

        table.json("assigned_to").nullable();
        table.integer("created_by").unsigned().nullable();
        table.integer("deleted_by").unsigned().nullable();
        table.timestamps();

        table.unique(['material_id', 'group_id']);

        table.foreign("material_id").references("id").on("materials");
        table.foreign("group_id").references("id").on("groups");
        table.foreign("created_by").references("id").on("users");
        table.foreign("deleted_by").references("id").on("users");

    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('material_locations');
};
