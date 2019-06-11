exports.up = function (knex) {

    return knex.schema.createTable('materials', function (table) {
        table.increments('id');
        table.integer('material_category_id').unsigned();
        table.string('name');
        table.string('unit_of_measurement').nullable();
        table.decimal('unit_price', 13, 2).default(0.0);
        table.integer('total_quantity').nullable();
        table.string('image_path').nullable();
        table.json("assigned_to").nullable();
        table.integer("group_id").unsigned().nullable();
        table.integer("created_by").unsigned().nullable();
        table.integer("deleted_by").unsigned().nullable();
        table.timestamp('deleted_at').nullable();
        table.timestamps();

        table.foreign("material_category_id").references("id").on("material_categories");
        table.foreign("group_id").references("id").on("groups");
        table.foreign("created_by").references("id").on("users");
        table.foreign("deleted_by").references("id").on("users");
    });

};

exports.down = function (knex) {
    return knex.schema.dropTable('materials');
};
