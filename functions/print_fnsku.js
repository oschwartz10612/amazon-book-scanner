require("dotenv").config();
const SellingPartnerAPI = require("amazon-sp-api");
const prompt = require("prompt-validate");
const playSound = require("../lib/playSound");
const makeDb = require("../lib/db");
const { printTable } = require('console-table-printer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const ptp = require("pdf-to-printer");
const path = require('path');
const delay = require('delay');

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
var index = parseInt(prompt('INDEX (start at 1) >> '));
var page = parseInt(prompt('Next page (start at 0) >> '));

async function main() {
    const ISBN = prompt('ISBN >> ');
    if (ISBN == 'stop') {
        process.exit(0);
    } else {
        const data = await db.query('SELECT id, title, FNSKU from profitable_books WHERE ISBN = ?', [ISBN]);
        if (data.length > 1) {
            playSound('fail.mp3');
            console.log('More than 1 row!');
            return main();
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
                return main();
            }
        }
    }
}

main();

async function printPage() {

    if (page == 4) {
        playSound('attn.mp3');
        index += 1;
        prompt('Reload labels...');
        page = 0;
    }

    const id = makeid(5);
    const doc = new PDFDocument();
    var pdfStream = fs.createWriteStream(path.join(__dirname, `/output/output${id}.pdf`));

    doc.font('./assets/LibreBarcode128Text-Regular.ttf').fontSize(44);

    doc.text(toPrint[0], 104-(doc.widthOfString(toPrint[0])/2), (72-(doc.heightOfString(toPrint[0])/2))*index, {
        width: doc.page.width
    });
    doc.text(toPrint[1], 304-(doc.widthOfString(toPrint[1])/2), (72-(doc.heightOfString(toPrint[1])/2))*index,  {
        width: doc.page.width
    });
    doc.text(toPrint[2], 504-(doc.widthOfString(toPrint[2])/2), (72-(doc.heightOfString(toPrint[2])/2))*index,  {
        width: doc.page.width
    });

    doc.pipe(pdfStream)
    doc.end();

    playSound('attn.mp3');

    console.log(`Waiting for pdf page ${page}`);
    pdfStream.addListener('finish', () => {
        console.log(`Printing pdf page ${page}`);
        await ptp.print(path.join(__dirname, `/output/output${id}.pdf`), { printer: 'hp_LaserJet_4200' });
        main();
    });

    page += 1;
}

function makeid(length) {
    var result           = [];
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result.push(characters.charAt(Math.floor(Math.random() * 
 charactersLength)));
   }
   return result.join('');
}