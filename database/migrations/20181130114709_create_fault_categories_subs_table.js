exports.up = function(knex, Promise) {

    return knex.schema.createTable('fault_categories_subs', function(table) {
        table.integer("parent_category_id").unsigned();
        table.integer("child_category_id").unsigned();
        table.timestamp('deleted_at').nullable();
        table.timestamps();
    });

};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('fault_categories');
};
