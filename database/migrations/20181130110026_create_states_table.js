
exports.up = function(knex, Promise) {

    return knex.schema.createTable('states', function(table) {
        table.increments('id');
        table.string('name');
        table.integer('country_id').unsigned();
        table.timestamps();

        table.foreign('country_id').references('id').on('countries');
    });

};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('states');
};
