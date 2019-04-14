
exports.up = function(knex, Promise) {

    return knex.schema.createTable('tasks', function (table) {
        table.increments('id');
        table.string("name");
        table.string("type");
        table.string("description").nullable();
        table.string("related_to");
        table.string("relation_id");
        table.integer("status").default(0);
        table.string("status_comment").nullable();
        table.dateTime("start_date").nullable();//expected start date
        table.dateTime("end_date").nullable();//expected end date
        table.dateTime("actual_start_date").nullable();//
        table.dateTime("completed_date").nullable();//actual_end_date
        table.json("assigned_to");
        table.integer("group_id").unsigned().nullable();
        table.timestamps();

        table.foreign("group_id").references("id").on("groups");
    });

};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('tasks');
};
