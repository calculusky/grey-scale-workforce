exports.up = function(knex, Promise) {

    return knex.schema.createTable('assets', function(table) {
        table.increments('id');
        table.string("asset_name", 100);
        table.integer("asset_type").unsigned();
        table.string("asset_type_name", 50);
        table.integer("status").default(1).comment = "1 . for active, zero for inactive";
        table.integer("state").default(1).comment = "0 . Incident  - This will mean that the child of an asset has some issues or is in an inactive status, 1 . Operational - The asset and all of its child are all active";
        table.string("serial_no").nullable();
        table.text("description").nullable();
        table.text("inst_address").nullable();
        table.date("date_installed").nullable();
        table.string("ext_code").nullable().comment = "The id that represents this record in a different database";
        table.json("assigned_to").nullable();
        table.integer("group_id").unsigned().nullable();
        table.integer("created_by").unsigned().nullable();
        table.integer("deleted_by").unsigned().nullable();
        table.specificType('location', 'POINT').nullable();
        table.timestamp('deleted_at').nullable();
        table.timestamps();

        table.unique(['ext_code']);
        table.foreign("asset_type").references("id").on("asset_types");
        table.foreign("group_id").references("id").on("groups");
        table.foreign("created_by").references("id").on("users");
        table.foreign("deleted_by").references("id").on("users");
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('assets');
};
