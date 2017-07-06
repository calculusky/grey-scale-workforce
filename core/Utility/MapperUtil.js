/**
 * @author Okeke Paul
 * Created by paulex on 7/5/17.
 */

module.exports = function MapperUtil() {

};

module.exports.loadMapper = function (store = {}, path) {
    if (store[path]) {
        return store[path];
    }
    let mapper = require(path);
    if (mapper) {
        store[path] = new mapper();
    }
    return store[path];
};