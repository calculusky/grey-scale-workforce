exports.up = function(knex, Promise) {

    return knex.schema.createTable('material_requisitions', function (table) {
        table.increments('id');
        table.json('materials').comment="JSON that contains the materialID and Quantity being requested";
        table.string('work_order_id').nullable();
        table.integer('status').default(0);
        table.integer('requested_by').unsigned();
        table.integer('approved_by').unsigned().nullable();
        table.string('description').nullable();
        table.specificType('location', 'POINT').nullable();
        table.json("assigned_to").nullable();
        table.integer("group_id").unsigned().nullable();
        table.integer("created_by").unsigned().nullable();
        table.integer("deleted_by").unsigned().nullable();
        table.timestamp('deleted_at').nullable();
        table.timestamps();

        table.foreign("group_id").references("id").on("groups");
        table.foreign("created_by").references("id").on("users");
        table.foreign("deleted_by").references("id").on("users");
        table.foreign("requested_by").references("id").on("users");
        table.foreign("approved_by").references("id").on("users");
        table.foreign("work_order_id").references("work_order_no").on("work_orders");
    });

};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('material_requisitions');
};
