exports.up = function(knex, Promise) {

    return knex.schema.createTable('location_history', function (table) {
        table.increments('id');
        table.string("module");
        table.string("relation_id");
        table.specificType('location', 'POINT').nullable();
        table.timestamp('deleted_at').nullable();
        table.timestamps();
    });
    // knex.raw('ALTER TABLE location_history ADD location POINT');
};

exports.down = function(knex, Promise) {
    return knex.schema.createTable('location_history');
};
