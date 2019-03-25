exports.up = function(knex, Promise) {

    return knex.schema.createTable('work_orders', function (table) {
        table.increments('id');
        table.string('work_order_no').comment = "The major work order number";
        table.string("related_to").comment = "This is either customer or asset in most cases";
        table.string("relation_id").comment = "The customer id or the asset id as the case may be";
        table.integer("type_id").unsigned();
        table.json("labels").nullable();
        table.integer("status").default(1);
        table.string("priority").default("1").comment = "0 - Low, 1 -  Medium, 2 - High";
        table.text("summary").nullable();
        table.string("address_line").nullable();
        table.integer("city_id").unsigned().nullable();
        table.integer("state_id").unsigned().nullable();
        table.integer("country_id").unsigned().nullable();

        table.string("contact").nullable();
        table.string("contact_name").nullable();
        table.string("contact_phone").nullable();
        table.string("contact_email").nullable();

        table.string("source").nullable();
        table.string("source_id").nullable();

        table.date("issue_date");
        table.dateTime("start_date").nullable();//expected start date
        table.dateTime("end_date").nullable();//expected end date
        table.dateTime("actual_start_date").nullable();//
        table.dateTime("completed_date").nullable();//actual_end_date
        table.string("signature").nullable();

        table.string('parent_id').nullable();
        table.string("request_id").nullable().comment="For internal usage";
        table.json("metadata").nullable();
        table.json("assigned_to").nullable();
        table.integer("group_id").unsigned().nullable();
        table.integer("created_by").unsigned().nullable();
        table.integer("deleted_by").unsigned().nullable();

        table.timestamp('deleted_at').nullable();
        table.timestamps();

        table.unique(["work_order_no"]);

        table.foreign("type_id").references("id").on("work_order_types");
        table.foreign("city_id").references("id").on("cities");
        table.foreign("state_id").references("id").on("states");
        table.foreign("country_id").references("id").on("countries");
        table.foreign("created_by").references("id").on("users");
        table.foreign("deleted_by").references("id").on("users");
        table.foreign("group_id").references("id").on("groups");
        table.foreign("parent_id").references("work_order_no").on("work_orders");
    });

};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('work_orders');
};
