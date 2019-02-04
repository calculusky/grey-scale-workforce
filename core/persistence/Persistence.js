const redis = require('redis');
const redisMock = require('redis-mock');

/**
 * @author Paul Okeke
 * Date 18th-jan-2019
 * @name Persistence
 */
class Persistence {

    constructor(config) {
        const defaultConfig = {
            host: process.env.REDIS_HOST || "localhost",
            port: process.env.REDIS_PORT || 6379,
            auth_pass: process.env.REDIS_PASS || ""
        };
        this.config = config || defaultConfig;
        this.getClient = () => null;
    }

    /**
     *
     * @returns {Persistence}
     */
    connect() {
        if (this.getClient()) return this;
        const client = (process.env.NODE_ENV !== "test")
            ? redis.createClient(this.config)
            : redisMock.createClient();
        this.getClient = () => client;
        return this;
    }

    /**
     *
     * @returns {Promise<*>}
     */
    async disconnect() {
        return new Promise((res, rej) => {
            this.getClient().quit((e, j) => {
                if (e) return rej(e);
                return res(j);
            });
        });
    }

    /**
     *
     * @param values
     */
    set(...values) {
        this.getClient().set(...values,  ()=>null);
    }

    /**
     *
     * @param key
     * @returns {Promise<String|*>}
     */
    get(key) {
        return new Promise((res, rej) => {
            this.getClient().get(key, (err, data) => {
                if (err) return rej(err);
                return res(data);
            })
        });
    }

    /**
     *
     * @param keys
     * @returns {boolean}
     */
    delete(...keys){
        this.getClient().del(...keys);
        return true;
    }
}

module.exports = Persistence;