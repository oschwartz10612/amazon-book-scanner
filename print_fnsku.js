require("dotenv").config();
const SellingPartnerAPI = require("amazon-sp-api");
const prompt = require("prompt-validate");
const playSound = require("./lib/playSound");
const makeDb = require("./lib/db");
const { printTable } = require('console-table-printer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const doc = new PDFDocument();
const ptp = require("pdf-to-printer");
const path = require('path');

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

toPrint = [];

async function main() {
    const ISBN = prompt('ISBN >> ');
    if (ISBN == 'stop') {
        process.exit(0);
    } else {
        const data = await db.query('SELECT id, title, FNSKU from profitable_books WHERE ISBN = ?', [ISBN]);
        if (data.length > 1) {
            playSound('fail.mp3');
            console.log('More than 1 row!');
            main();
        } else if (data.length == 0) {
            playSound('fail.mp3');
            console.log('Not known FNSKU...');
            return main();
            
        } else {

            printTable(data);
            playSound('success.mp3');

            if (toPrint.length == 2) {
                toPrint.push(data[0].FNSKU);
                await printPage();
                toPrint = [];
            } else {
                toPrint.push(data[0].FNSKU);
            }


        }

        main();
    }
}

main();

async function printPage() {
    doc.pipe(fs.createWriteStream('./assets/output.pdf'));

    doc.font('./assets/LibreBarcode128Text-Regular.ttf').fontSize(40).text(toPrint[0], 104, 72);
    doc.font('./assets/LibreBarcode128Text-Regular.ttf').fontSize(40).text(toPrint[1], 304, 72);
    doc.font('./assets/LibreBarcode128Text-Regular.ttf').fontSize(40).text(toPrint[2], 504, 72);

    doc.end();

    await ptp.print(path.join(__dirname, '/assets/output.pdf'), { printer: 'hp_LaserJet_4200' });

}