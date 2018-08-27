
exports.up = function(knex, Promise) {
    return knex.schema.createTable('users', (t)=>{
        t.increments('id').unsigned().primary();
    })
};

exports.down = function(knex, Promise) {
  
};
