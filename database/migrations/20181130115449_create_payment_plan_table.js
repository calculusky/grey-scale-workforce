exports.up = function(knex, Promise) {

    return knex.schema.createTable('payment_plans', function (table) {
        table.increments('id');
        table.integer('disc_order_id').unsigned();
        table.string('period').default(0).comment="e.g 3M(3 months), 2Y(2years)";
        table.decimal('amount',13,2).nullable();
        table.decimal('balance',13,2).nullable();
        table.integer('approval_status').default(0);
        table.integer('approved_by').nullable().unsigned();
        table.dateTime('approval_date').nullable();
        table.integer('waive_percentage').nullable();
        table.integer('status').default(0);//0: inactive 1: approved 2: active (This payment plan should be active only when the customer has fulfilled his bargain by paying the first amount)
        table.string("wf_case_id").nullable();
        table.json("assigned_to").nullable();
        table.integer("group_id").unsigned().nullable();
        table.integer("created_by").unsigned().nullable();
        table.integer("deleted_by").unsigned().nullable();
        table.timestamp('deleted_at').nullable();
        table.timestamps();

        table.foreign('disc_order_id').references('id').on('disconnection_billings');
        table.foreign('approved_by').references('id').on('users');
        table.foreign("created_by").references("id").on("users");
        table.foreign("deleted_by").references("id").on("users");
        table.foreign("group_id").references("id").on("groups");
    });

};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('payment_plans');
};
