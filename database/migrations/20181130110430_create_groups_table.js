
exports.up = function(knex, Promise) {

    return knex.schema.createTable('groups', function(table) {
        table.increments('id');
        table.string("name").unique();
        table.string("type").comment = "A Business Unit or an Undertaking";
        table.string("short_name").unique().nullable().comment = "Like an area code, unit code etc.";
        table.string("ext_code").nullable().comment = "A Code externally used to represent this group";
        table.string("description").nullable();
        table.json("assigned_to").nullable();
        table.string("wf_group_id").nullable();
        table.integer("group_id").unsigned().nullable();
        table.integer("created_by").unsigned().nullable();
        table.integer("deleted_by").unsigned().nullable();
        table.unique(['ext_code']);
        table.timestamps();
        // table.softDeletes();         TypeError: table.softDeletes is not a function
        table.timestamp('deleted_at').nullable();
    });

};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('groups');
}