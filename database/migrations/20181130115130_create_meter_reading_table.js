exports.up = function(knex, Promise) {

    return knex.schema.createTable('meter_readings', function (table) {
        table.increments('id');
        table.string("meter_no");
        table.string("tariff").nullable();
        table.decimal("current_reading", 20, 2).default(0.0);
        table.decimal("previous_reading", 20, 2).default(0.0);
        table.decimal("current_bill", 13, 2).default(0.0);
        table.decimal("current_opening_bal", 13, 2).default(0.0);
        table.decimal("current_closing_bal", 13, 2).default(0.0);
        table.decimal("current_billing_adjustment", 13, 2).nullable();
        table.decimal("current_payment", 13, 2).default(0.0);
        table.decimal("last_payment", 13, 2).nullable();
        table.date("last_payment_date").nullable();
        table.specificType('reading_code', 'CHAR(4) DEFAULT NULL');
        table.specificType('location', 'POINT').nullable();
        table.string("reading_section", 45).nullable();
        table.string("demand", 45).nullable();
        table.decimal("energy", 20, 2).nullable();
        table.decimal("fixed_charge", 13, 2).nullable();
        table.decimal("vat_charge", 13, 2).default();
        table.string("create_source").nullable();
        table.string("update_source").nullable();
        table.json("assigned_to").nullable();
        table.date("read_date");
        table.integer("group_id").unsigned().nullable();
        table.integer("created_by").unsigned().nullable();
        table.integer("deleted_by").unsigned().nullable();
        table.string("request_id").nullable();

        table.foreign("created_by").references("id").on("users").onDelete("cascade");
        table.foreign("deleted_by").references("id").on("users");
        table.foreign("group_id").references("id").on("groups").onDelete("cascade");

        table.timestamp('deleted_at').nullable();
        table.timestamps();
    });


};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('meter_readings');
};
