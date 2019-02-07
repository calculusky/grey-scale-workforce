exports.up = function(knex, Promise) {

    return knex.schema.createTable('work_order_types', function (table) {
        table.increments('id');
        table.string("name");
        table.timestamp('deleted_at').nullable();
        table.timestamps();
    });

};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('work_order_types');
};
