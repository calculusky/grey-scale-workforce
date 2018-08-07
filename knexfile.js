// Update with your config settings.

module.exports = {

    development: {
        client: 'mysql2',
        connection: {
            filename: './dev.sqlite3'
        },
        migrations: {
            directory: __dirname + `/database/migrations`,
            tableName: 'migrations'
        }
    },

    staging: {
        client: 'mysql2',
        connection: {
            database: process.env.DB_DATABASE,
            user: process.env.DB_USER,
            password: process.env.DB_PASS
        },
        pool: {
            min: 2,
            max: 10
        },
        migrations: {
            directory: "./database/migrations",
            tableName: 'migrations'
        }
    },

    production: {
        client: 'mysql2',
        connection: {
            database: process.env.DB_DATABASE,
            user: process.env.DB_USER,
            password: process.env.DB_PASS
        },
        pool: {
            min: 2,
            max: 10
        },
        migrations: {
            tableName: 'migrations',
            directory: "./database/migrations",
        }
    }

};
