exports.up = function(knex, Promise) {

    return knex.schema.createTable('notes', function(table) {
        table.increments('id');
        table.integer("relation_id").unsigned();
        table.string("module");
        table.text("note");
        table.string("source").nullable().comment= "The Source from which this note was made";
        table.string("source_id").nullable();
        table.string("source_name").nullable();
        table.specificType('location', 'POINT').nullable();
        table.json("assigned_to").nullable();
        table.integer("created_by").unsigned().nullable();
        table.integer("deleted_by").unsigned().nullable();
        table.integer("group_id").unsigned().nullable();
        table.string("request_id").nullable();
        table.timestamp('deleted_at').nullable();
        table.timestamps();

        table.foreign("created_by").references("id").on("users");
        table.foreign("deleted_by").references("id").on("users");
        table.foreign("group_id").references("id").on("groups");
    });

};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('notes');
};
