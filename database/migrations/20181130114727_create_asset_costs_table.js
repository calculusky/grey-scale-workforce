exports.up = function(knex, Promise) {

    return knex.schema.createTable('asset_costs', function (table) {
        table.increments('id');
        table.integer('asset_id').unsigned();
        table.string('original_cost');
        table.string('operation_cost');
        table.string('replacement_value');
        table.string('maintenance_cost');
        table.string('historical_maintenance_cost');
        table.foreign("asset_id").references('id').on("assets").onDelete("cascade");
        table.timestamp('deleted_at').nullable();
        table.timestamps();
    });

};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('asset_costs');
};
