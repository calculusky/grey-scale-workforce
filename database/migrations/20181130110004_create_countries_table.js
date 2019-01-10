
exports.up = function(knex, Promise) {

    return knex.schema.createTable('countries', function(table) {
        table.increments('id');
        table.string('short_code');
        table.string('name');
        table.integer('phone_code');
        table.timestamps();
    });

};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('countries');
};
