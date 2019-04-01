
exports.up = function(knex, Promise) {

    return knex.schema.createTable('statuses', function (table) {
        table.integer('id');
        table.string("type");
        table.string("name");
        table.json("comments");
        table.json("assigned_to");
        table.integer("group_id").unsigned().nullable();
        table.integer("parent_id").unsigned().nullable();
        table.integer("deleted_by").unsigned().nullable();
        table.timestamp('deleted_at');
        table.integer("created_by").unsigned().nullable();
        table.timestamp("created_at");
        table.timestamp("updated_at");
        table.foreign("parent_id").references("id").on("statuses");
        table.foreign("deleted_by").references("id").on("users");
        table.foreign("created_by").references("id").on("users");
        table.foreign("group_id").references("id").on("groups");

        table.unique(["id","type"]);
    });

};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('statuses');
};
