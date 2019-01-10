exports.up = function(knex, Promise) {

    return knex.schema.createTable('fault_categories', function(table) {
        table.increments('id');
        table.string("name");
        table.string("type").nullable();
        table.string("weight").nullable();
        table.timestamp('deleted_at').nullable();
        table.timestamps();
    });

};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('fault_categories');
};
