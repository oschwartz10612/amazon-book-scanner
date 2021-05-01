require("dotenv").config();
const SellingPartnerAPI = require("amazon-sp-api");
const makeDb = require("./lib/db");

let sellingPartner = new SellingPartnerAPI({
    region: "na", // The region of the selling partner API endpoint ("eu", "na" or "fe")
    refresh_token: process.env.REFRESH_TOKEN, // The refresh token of your app user
});

const db = makeDb({
    host: process.env.MYSQL_DOMAIN,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_DATABASE,
});

(async () => {

    const data = await db.query('SELECT * FROM profitable_books WHERE offer IS NULL AND ASIN IS NOT NULL LIMIT 250');
    console.log(data.length);

    var count = 0;

    data.forEach(async book => {

        var offer = 0;


        if (book.low_amazon == null) {
            offer = book.best_price + 5
        } else if (book.low_amazon - book.fee < 3) {
        
            offer = book.best_price
        } else {
            offer = book.low_amazon
        }
    
        await db.query('UPDATE profitable_books SET ? WHERE id=?', [{
            offer: offer,
        }, book.id]);




        count += 1;

        console.log(`${book.id} - ${count}`);
        if (count == data.length) {
            process.exit(0)
        }

        //console.log(JSON.stringify(pricing, null, 2));

    });
//console.log('Done');

})();