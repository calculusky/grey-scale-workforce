exports.up = function (knex) {
    return knex.schema.createTable('assets_assets', function(table){
        table.integer("parent_id").unsigned();
        table.integer("child_id").unsigned();
        table.primary(['parent_id', 'child_id']);
        table.timestamps();
        table.foreign("parent_id").references("id").on("assets");
        table.foreign("child_id").references("id").on("assets");
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable('assets_assets');
};
