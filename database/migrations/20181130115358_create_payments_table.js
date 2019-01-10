exports.up = function(knex, Promise) {

    return knex.schema.createTable('payments', function (table) {
        table.increments('id');
        table.string('system');
        table.string('system_id');
        table.decimal('amount', 13, 2).comment = "Amount Paid";
        table.string('transaction_id').unique();
        table.string('payer').nullable().comment = "The name of the customer that made this payment";
        table.string('channel').nullable().comment = "The name of the payment gateway";
        table.integer('status').default(0).comment = "Specifies if this payment has been processed internally or not. 0 = not processed, 1 = Processing, 2 = Processed , 3 = Error";
        table.string('details').nullable();
        table.json("assigned_to").nullable();
        table.integer("group_id").unsigned().nullable();
        table.integer("created_by").unsigned().nullable();
        table.integer("deleted_by").unsigned().nullable();
        table.dateTime('payment_date');
        table.timestamp('deleted_at').nullable();
        table.timestamps();

        table.foreign("created_by").references("id").on("users");
        table.foreign("deleted_by").references("id").on("users");
        table.foreign("group_id").references("id").on("groups");
    });

};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('payments');
};
