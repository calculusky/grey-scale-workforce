
exports.up = function(knex, Promise) {

    return knex.schema.createTable('addresses', function(table) {
        table.increments('id');
        table.string("address_1");
        table.string("address_2").nullable();
        table.integer("city_id").unsigned();
        table.integer("state_id").unsigned();
        table.integer("country_id").unsigned();
        table.string("district").nullable();
        table.string("postal_code").nullable();
        table.timestamps();

        table.foreign("city_id").references("id").on("cities");
        table.foreign("state_id").references("id").on("states");
        table.foreign("country_id").references("id").on("countries");
    });


};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('group_subs');
};
