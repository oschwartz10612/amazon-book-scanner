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

const dbSocketPath = process.env.DB_SOCKET_PATH || '/cloudsql';
const db = makeDb({
  socketPath: `${dbSocketPath}/${process.env.CLOUD_SQL_CONNECTION_NAME}`,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASS,
  database: process.env.MYSQL_DATABASE,
});

module.exports = db;