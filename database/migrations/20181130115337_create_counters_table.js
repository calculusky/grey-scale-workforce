exports.up = function(knex, Promise) {

    return knex.schema.createTable('unit_counters', function (table) {
        table.specificType('unit_name', 'CHAR(5) DEFAULT NULL');
        table.integer("work_orders").default(0);
        table.integer("faults").default(0);
        table.integer("inspections").default(0);
        table.timestamp('deleted_at').nullable();
        table.timestamps();
    });

};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('unit_counters');
};
