
exports.up = function(knex, Promise) {

    //This table will determine the customers that uses a particular assets
    // and also determines the asset that a customer falls under
    return knex.schema.createTable('customers_assets', function (table) {
        table.string("customer_id");
        table.integer("asset_id").unsigned();
        table.timestamps();

        table.primary(['customer_id', 'asset_id']);
        table.foreign("asset_id").references("id").on("assets");
        table.foreign("customer_id").references("account_no").on("customers");
    });

};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('customers_assets');
};
