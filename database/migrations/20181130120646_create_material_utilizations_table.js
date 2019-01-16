exports.up = function(knex, Promise) {

    return knex.schema.createTable('material_utilizations', function (table) {
        table.increments('id');
        table.integer("work_order_id").unsigned();
        table.integer("material_id").unsigned();
        table.decimal("quantity");
        table.specificType('location', 'POINT').nullable();
        table.text("description").nullable();
        table.json("assigned_to").nullable();
        table.integer("group_id").unsigned().nullable();
        table.integer("created_by").unsigned().nullable();
        table.integer("deleted_by").unsigned().nullable();
        table.timestamp('deleted_at').nullable();
        table.timestamps();

        table.foreign("work_order_id").references("id").on("work_orders");
        table.foreign("material_id").references("id").on("materials");
        table.foreign("group_id").references("id").on("groups");
        table.foreign("created_by").references("id").on("users");
        table.foreign("deleted_by").references("id").on("users");
    });

};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('material_utilizations');
};
