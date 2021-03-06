
exports.up = function(knex, Promise) {

    return knex.schema.createTable('notifications', function (table) {
        table.increments('id');
        table.string("type");
        table.string("title").nullable();
        table.string("message");
        table.integer("status").default(0);
        table.integer("level").default(0);
        table.json("record_ids").comment = "The record id's this notification is related to";
        table.json("notification_data").comment = "Extra details required for notifications";
        table.string("from");
        table.json("to").comment="An array of user ids this notification is meant for.";
        table.json("group").comment= "An array of group ids this notification is meant for";
        table.timestamp('deleted_at').nullable();
        table.timestamps();
        table.unique(["type","title","message"]);
    });

};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('notifications');
};
