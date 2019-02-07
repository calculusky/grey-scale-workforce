
exports.up = function(knex, Promise) {

    return knex.schema.createTable('tasks', function (table) {
        table.increments('id');
        table.string("name");
        table.string("type");
        table.string("description").nullable();
        table.string("related_to");
        table.string("relation_id");
        table.integer("status").default(0);
        table.dateTime("start_date");
        table.dateTime("completion_date");
        table.json("assigned_to");
        table.integer("group_id").unsigned().nullable();
        table.timestamps();

        table.foreign("group_id").references("id").on("groups");
    });

};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('tasks');
};
