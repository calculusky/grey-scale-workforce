exports.up = function(knex, Promise) {

    return knex.schema.createTable('asset_types', function(table) {
        table.increments('id');
        table.string('name');
        table.timestamp('deleted_at').nullable();
        table.timestamps();
    });

};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('asset_types');
};
