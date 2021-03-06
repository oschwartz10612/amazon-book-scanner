require("dotenv").config();
const SellingPartnerAPI = require("amazon-sp-api");
const prompt = require("prompt-validate");
const playSound = require("../lib/playSound");
const makeDb = require("../lib/db");
const { printTable } = require('console-table-printer');

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

async function main() {
    const ISBN = prompt('ISBN >> ');
    if (ISBN == 'stop') {
        process.exit(0);
    } else if(ISBN.startsWith("box")) {
        const data = await db.query('SELECT box_id, title, kept FROM unprofitable_books WHERE kept = TRUE AND box_id = ?', [ISBN]);
        if (data.length > 0) {
            printTable(data);
            playSound('success.mp3');
        } else {
            playSound('fail.mp3');
        }
        return main();
    } else {
        const data = await db.query('SELECT box_id, title, kept FROM unprofitable_books WHERE kept = TRUE AND ISBN = ?', [ISBN]);
        if (data.length == 0) {
            playSound('fail.mp3');
            console.log('Not known ISBN...');
            return main();
            
        } else {
            printTable(data);
            playSound('success.mp3');
        }

        main();
    }
}

main();

