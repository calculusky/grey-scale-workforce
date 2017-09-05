/**
 * Created by paulex on 7/5/17.
 */
const KNEX = require('knex')({
    client: "mysql2", connection: {
        host: '127.0.0.1',
        user: 'root',
        password: 'Nigeriasns$1',
        database: 'mr_working'
    }
});
/**
 * @name Context
 */
class Context{
    
    constructor(config){
        this.database = KNEX;
    }
    
}

module.exports = new Context();