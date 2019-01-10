
exports.up = function(knex, Promise) {

    return knex.schema.createTable('password_resets', function(table) {
        table.string('email').index();
        table.string('token');
        table.timestamp('created_at').nullable();
    });

};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('password_resets');
};
