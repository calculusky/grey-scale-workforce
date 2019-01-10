
exports.up = function(knex, Promise) {

    return knex.schema.createTable('group_subs', function(table) {
        table.integer("parent_group_id").unsigned();
        table.integer("child_group_id").unsigned();
        table.primary(['parent_group_id', 'child_group_id']);
        table.timestamps();

        table.foreign("parent_group_id").references("id").on("groups");
        table.foreign("child_group_id").references("id").on("groups");
    });

};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('group_subs');
};
