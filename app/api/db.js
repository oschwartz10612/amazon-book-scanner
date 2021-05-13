const mysql = require("mysql");
const util = require("util");

function makeDb(config) {
    const connection = mysql.createPool(config);
    return {
        query(sql, args) {
            return util.promisify(connection.query).call(connection, sql, args);
        },
        close() {
            return util.promisify(connection.end).call(connection);
        },
    };
}

module.exports = makeDb;