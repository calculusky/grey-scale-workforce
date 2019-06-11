exports.up = function(knex, Promise) {

    return knex.schema.createTable('fault_categories_subs', function(table) {
        table.integer("parent_category_id").unsigned();
        table.integer("child_category_id").unsigned();
        table.timestamp('deleted_at').nullable();
        table.timestamps();

        table.foreign('parent_category_id').references('id').on('fault_categories');
        table.foreign('child_category_id').references('id').on('fault_categories');
    });

};

exports.down = function(knex) {
    return knex.schema.dropTable('fault_categories');
};
