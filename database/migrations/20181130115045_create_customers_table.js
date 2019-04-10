exports.up = function(knex, Promise) {

    return knex.schema.createTable('customers', function (table) {
        table.string("account_no");
        table.string("old_account_no").nullable();
        table.string("meter_no").nullable();
        table.string("first_name").nullable();
        table.string("last_name").nullable();
        table.string("email").nullable();
        table.string("customer_name").nullable();
        table.integer("status").default(1).comment = "Determines if this customer is active of suspended";
        table.integer("address_id").unsigned().nullable();
        table.string("mobile_no").nullable();
        table.string("plain_address").nullable();
        table.string("service_plain_address").nullable();
        table.string("customer_type").nullable();
        table.string("meter_type").nullable();
        table.string("meter_status").nullable();
        table.string("tariff").nullable();
        table.string("ext_code").nullable();
        table.json("metadata").nullable();
        table.json("assigned_to").nullable();
        table.integer("created_by").unsigned().nullable();
        table.integer("deleted_by").unsigned().nullable();
        table.integer("group_id").unsigned().nullable();
        table.timestamp('deleted_at').nullable();
        table.timestamps();

        table.primary(['account_no']);
        table.unique("account_no");
        table.unique("ext_code");

        table.foreign("address_id").references("id").on("addresses");
        table.foreign("created_by").references("id").on("users");
        table.foreign("deleted_by").references("id").on("users");
        table.foreign("group_id").references("id").on("groups");
    });

};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('customers');
};
