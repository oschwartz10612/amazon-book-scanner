require("dotenv").config();
const SellingPartnerAPI = require("amazon-sp-api");
const prompt = require("prompt-validate");
var player = require("play-sound")((opts = {}));
const ISBNAuditer = require("isbn3");
const util = require("util");
const mysql = require("mysql");

let sellingPartner = new SellingPartnerAPI({
    region: "na", // The region of the selling partner API endpoint ("eu", "na" or "fe")
    refresh_token: process.env.REFRESH_TOKEN, // The refresh token of your app user
});

function makeDb(config) {
    const connection = mysql.createConnection(config);
    return {
        query(sql, args) {
            return util.promisify(connection.query).call(connection, sql, args);
        },
        close() {
            return util.promisify(connection.end).call(connection);
        },
    };
}

const db = makeDb({
    host: process.env.MYSQL_DOMAIN,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_DATABASE,
});


(async () => {

    const data = await db.query('SELECT * from profitable_books LIMIT 1');

    data.forEach(async book => {


        const pricing = await sellingPartner.callAPI({
            operation: "getItemOffers",
            query: {
                MarketplaceId: process.env.MARKET_ID,
                ItemCondition: 'Used'
            },
            path: {
                Asin: book.ASIN
            }
        });

        console.log(JSON.stringify(pricing, null, 2));

    });


})();