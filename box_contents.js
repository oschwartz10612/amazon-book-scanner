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

var mail_box_id = '';

async function getStartingSKU() {
    var lastRow = await db.query(
      "SELECT * FROM profitable_books WHERE sent = 1 AND mail_box_id IS NOT NULL ORDER BY id DESC LIMIT 0, 1"
    );
    if (lastRow.length > 0) {
        mail_box_id = lastRow[0].mail_box_id;
    }
    console.log(`Mail box is : ${mail_box_id}`);
    main();
  }

async function main() {
    const FNSKU = prompt('FNSKU >> ');
    if (FNSKU == 'stop') {
        process.exit(0);
    } else if (FNSKU.startsWith('mail_box')){
        mail_box_id = FNSKU;
        console.log(`New mail box: ${mail_box_id}`);
        main();
    } else {
        const data = await db.query('UPDATE profitable_books SET mail_box_id = ? WHERE FNSKU = ?', [mail_box_id,FNSKU]);
        if (data.length > 1) {
            console.log('More than 1 row!');
            process.exit(0);
        }
        main();
    }
}

getStartingSKU();
