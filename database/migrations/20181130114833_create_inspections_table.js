
exports.up = function(knex, Promise) {

    return knex.schema.createTable('inspections', function (table) {
        table.increments('id');
        table.timestamps();
    });

};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('inspections');
};
