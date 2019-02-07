
exports.up = function(knex, Promise) {

    return knex.schema.createTable('rc_fees', function (table) {
        table.increments('id');
        table.string('name').unique();
        table.decimal('amount',13,2);
        table.timestamps();
    });

};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('rc_fees');
};
