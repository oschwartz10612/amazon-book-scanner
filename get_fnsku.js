require("dotenv").config();
const SellingPartnerAPI = require("amazon-sp-api");
const prompt = require("prompt-validate");
var player = require("play-sound")((opts = {}));
const ISBNAuditer = require("isbn3");
const util = require("util");
const mysql = require("mysql");
const delay = require('delay');


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

    const data = await db.query('SELECT * FROM profitable_books WHERE FNSKU IS NULL AND sent = 1 LIMIT 50');
    const SKUs = data.map(book => book.SKU);
    console.log(SKUs.length);

    var count = 0;

    const summary = await sellingPartner.callAPI({
        operation: "getInventorySummaries",
        query: {
            marketplaceIds: [process.env.MARKET_ID],
            granularityId: process.env.MARKET_ID,
            granularityType: 'Marketplace',
            sellerSkus: SKUs
        }
    });

    console.log(summary.inventorySummaries.length);

    summary.inventorySummaries.forEach(async item => {
        try {
            await db.query('UPDATE profitable_books SET FNSKU = ? WHERE SKU = ?', [item.fnSku, item.sellerSku]);
        } catch (error) {
            console.log(`There was a problem setting sql for ${item.sellerSku}`);
        }
        count += 1;
        console.log(`${count} - ${item.sellerSku}`);

        if (count == SKUs.length) {
            process.exit(0);
        }
    });
    

})();