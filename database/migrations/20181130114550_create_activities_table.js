exports.up = function(knex, Promise) {

    return knex.schema.createTable('activities', function(table) {
        table.increments('id');
        table.integer("relation_id");
        table.string("module");
        table.string("service_name");
        table.string("activity_type");//can edit, update etc
        table.string("model_type");//can edit, update etc
        table.string("description");
        table.string("source").nullable().comment = "The Source from which this activity was made";
        table.string("source_id").nullable().comment = "The source id which can be null";
        table.string("source_name").nullable().comment = "If there is a name it can go here";
        table.json("assigned_to").nullable();
        table.integer("activity_by").unsigned().nullable();
        table.integer("group_id").unsigned().nullable();
        table.integer("ip_address").unsigned().nullable();
        table.json("record").nullable();
        table.timestamp('deleted_at').nullable();
        table.timestamps();

        table.foreign("activity_by").references("id").on("users");
        table.foreign("group_id").references("id").on("groups");
    });

};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('activities');
};
