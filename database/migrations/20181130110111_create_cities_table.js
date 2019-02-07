
exports.up = function(knex, Promise) {

    return knex.schema.createTable('cities', function(table) {
        table.increments('id');
        table.string('name');
        table.foreign('state_id').references('id').on('states');
        table.integer('state_id').unsigned();
        table.timestamps();
    });

};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('cities');
};
