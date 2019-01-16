
exports.up = function(knex, Promise) {

    return knex.schema.createTable('stock_movements', function (table) {
        table.increments('id');
        table.integer('material_id').unsigned();
        table.integer("group_id").unsigned().nullable();
        table.integer('quantity');
        table.string('type');
        table.string('who');

        table.integer("created_by").unsigned().nullable();
        table.integer("deleted_by").unsigned().nullable();

        table.json("assigned_to").nullable();
        table.foreign("material_id").references("id").on("materials");
        table.foreign("group_id").references("id").on("groups");
        table.foreign("created_by").references("id").on("users");
        table.foreign("deleted_by").references("id").on("users");
        table.timestamps();
    });

};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('stock_movements');
};
