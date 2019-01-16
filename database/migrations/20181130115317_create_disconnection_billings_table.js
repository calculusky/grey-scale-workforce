exports.up = function(knex, Promise) {

    return knex.schema.createTable('disconnection_billings', function (table) {
        table.increments('id');
        table.string("account_no");
        table.string("work_order_id").nullable().unique();//conditions apply to the nullablity of this
        table.decimal("current_bill", 13, 2).nullable();
        table.decimal("arrears", 13, 2).nullable();
        table.decimal("actual_amount", 13, 2).nullable().comment = "The sum of the current bill and arrears";
        table.decimal("min_amount_payable", 13, 2).nullable().comment = "The Amount Due";
        table.decimal("total_amount_payable", 13, 2).nullable().comment = "The total amount due + reconnection fee";
        table.decimal("reconnection_fee", 13, 2).default(3000.00);
        table.boolean('has_plan').default(0).comment = "Determines if this order have a payment plan";
        table.boolean('requires_security').default(0).comment = "The customer is offensive";
        table.json("assigned_to").nullable();
        table.integer("group_id").unsigned().nullable();
        table.integer("created_by").unsigned().nullable();
        table.timestamp('deleted_at').nullable();
        table.timestamps();

        table.foreign("created_by").references("id").on("users");
        table.integer("deleted_by").unsigned().nullable();
        table.foreign("group_id").references("id").on("groups");
        table.foreign("account_no").references("account_no").on("customers");
        table.foreign("work_order_id").references("work_order_no").on("work_orders");
    });

};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('disconnection_billings');
};
