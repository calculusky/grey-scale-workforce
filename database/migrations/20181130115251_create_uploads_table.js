exports.up = function(knex, Promise) {

    return knex.schema.createTable('uploads', function (table) {
        table.increments('id');
        table.string('file_name');
        table.string('original_file_name');
        table.string('file_size');
        table.string('file_type');
        table.string('file_path');
        table.string('upload_type');
        table.string('status').default(0);//im guessing 0 should be pending
        table.text('message').nullable().comment = "This can be used to set the error message etc.";
        table.string('external_file_name').nullable();
        table.json("assigned_to").nullable();
        table.integer("created_by").unsigned().nullable();
        table.integer("group_id").unsigned().nullable();

        table.foreign("created_by").references("id").on("users");
        table.foreign("deleted_by").references("id").on("users");
        table.integer("deleted_by").unsigned().nullable();
        table.foreign("group_id").references("id").on("groups");
        table.timestamp('deleted_at').nullable();
        table.timestamps();
    });

};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('uploads');
};
