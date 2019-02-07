exports.up = function(knex, Promise) {

    return knex.schema.createTable('asset_sub_types', function(table) {
        table.increments('id');
        table.integer('parent_id').unsigned();
        table.integer('child_id').unsigned();
        table.foreign("parent_id").references('id').on('asset_types').onDelete('cascade');
        table.foreign("child_id").references('id').on('asset_types').onDelete('cascade');
        table.timestamp('deleted_at').nullable();
        table.timestamps();
    });

};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('asset_sub_types');
};
