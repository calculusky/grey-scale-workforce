exports.up = function(knex, Promise) {

    return knex.schema.createTable('attachments', function(table) {
        table.increments('id');
        table.integer("relation_id");
        table.string("module", 45);
        table.string("file_name", 100);
        table.string("file_size", 45);
        table.string("file_path");
        table.string("file_type", 100);
        table.specificType('location', 'POINT').nullable();
        table.string("details").nullable();
        table.json("assigned_to").nullable();
        table.integer("group_id").unsigned().nullable();
        table.integer("created_by").unsigned().nullable();
        table.integer("deleted_by").unsigned().nullable();
        table.timestamp('deleted_at').nullable();
        table.timestamps();

        table.foreign("created_by").references("id").on("users");
        table.foreign("deleted_by").references("id").on("users");
        table.foreign("group_id").references("id").on("groups");
    });

};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('attachments');
};
