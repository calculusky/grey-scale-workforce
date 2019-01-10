exports.up = function(knex, Promise) {

    return knex.schema.createTable('faults', function (table) {
        table.increments('id');
        table.string('fault_no').unique().nullable();
        table.string("related_to").comment = "This is either a customer or an asset in most cases";
        table.string("relation_id").comment = "The customer id or the asset id as the case may be";
        table.json("labels").nullable();
        table.string("priority").nullable();
        table.integer("status").default(1);
        table.integer("fault_category_id").unsigned();
        table.text("summary").nullable();
        table.text("resolution").nullable();
        table.dateTime("issue_date").nullable().comment = "The date this fault was issued, it can be diff from created_at";
        table.dateTime("completed_date").nullable();
        table.string("source").nullable();
        table.string("source_id").nullable();
        table.string("request_id").nullable();
        table.string("signature").nullable();
        table.string("permit_no").nullable();
        table.json("assigned_to").nullable();
        table.integer("group_id").unsigned().nullable();
        table.integer("created_by").unsigned().nullable();
        table.integer("deleted_by").unsigned().nullable();

        table.timestamp('deleted_at').nullable();
        table.timestamps();

        table.foreign("fault_category_id").references("id").on("fault_categories");
        table.foreign("created_by").references("id").on("users");
        table.foreign("deleted_by").references("id").on("users");
        table.foreign("group_id").references("id").on("groups");
    });

};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('faults');
};
