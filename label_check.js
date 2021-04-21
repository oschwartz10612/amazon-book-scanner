require("dotenv").config();
const SellingPartnerAPI = require("amazon-sp-api");
const prompt = require("prompt-validate");
const playSound = require("./lib/playSound");
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

async function main() {
    const FNSKU = prompt('FNSKU >> ');
    if (FNSKU == 'stop') {
        process.exit(0);
    } else {
        const data = await db.query('SELECT * from profitable_books WHERE FNSKU = ?', [FNSKU]);
        if (data.length > 1) {
            playSound('fail.mp3');
            console.log('More than 1 row!');
            main();
        } else if (data.length == 0) {
            playSound('fail.mp3');
            console.log('Not known FNSKU...');
            return main();
            
        } else {
            while (true) {
                playSound('success.mp3');
                const ISBN = prompt('ISBN >> ');
                if (ISBN == data[0].ISBN) {
                    playSound('success.mp3');
                    break
                } else {
                    playSound('fail.mp3');
                }
            }

        }

        main();
    }
}

main();

