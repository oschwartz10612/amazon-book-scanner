require("dotenv").config();
const SellingPartnerAPI = require("amazon-sp-api");
const prompt = require("prompt-validate");
const playSound = require("../lib/playSound");
const makeDb = require("../lib/db");
const { printTable } = require('console-table-printer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
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
        const data = await db.query('SELECT id, title, FNSKU from profitable_books WHERE ISBN = ? AND FNSKU IS NOT NULL', [ISBN]);
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
                page += 1;
                toPrint = [];
                main();
            } else {
                toPrint.push(data[0].FNSKU);
                return main();
            }
        }
    }
}

main();

async function printPage() {

    if (page == 3) {
        playSound('attn.mp3');
        index += 1;
        prompt('Reload labels...');
        page = 0;
    }

    const id = makeid(5);
    const doc = new PDFDocument();
    var pdfStream = fs.createWriteStream(path.join(__dirname, `../output/output${id}.pdf`));
    const reverseToPrint = toPrint.reverse();

    doc.font('./assets/LibreBarcode128Text-Regular.ttf').fontSize(44);

    doc.text(reverseToPrint[0], 104 - (doc.widthOfString(reverseToPrint[0]) / 2), ((72*index) - (doc.heightOfString(reverseToPrint[0]) / 2)), {
        width: doc.page.width
    });
    doc.text(reverseToPrint[1], 304 - (doc.widthOfString(reverseToPrint[1]) / 2), ((72*index) - (doc.heightOfString(reverseToPrint[1]) / 2)), {
        width: doc.page.width
    });
    doc.text(reverseToPrint[2], 504 - (doc.widthOfString(reverseToPrint[2]) / 2), ((72*index) - (doc.heightOfString(reverseToPrint[2]) / 2)), {
        width: doc.page.width
    });

    doc.pipe(pdfStream)
    doc.end();

    playSound('attn.mp3');

    console.log(`Waiting for pdf page ${page}`);
    return new Promise((resolve, reject) => {
        pdfStream.addListener('finish', async () => {
            console.log(`Printing pdf page ${page}`);
            const filepath = path.join(__dirname, `../output/output${id}.pdf`);
            const { stdout, stderr } = await exec(`lp ${filepath}`);

            if (stderr) {
                console.error(`error: ${stderr}`);
                reject();
            }
            console.log(`Number of files ${stdout}`);
            resolve();
        });
    });
};

function makeid(length) {
    var result = [];
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result.push(characters.charAt(Math.floor(Math.random() *
            charactersLength)));
    }
    return result.join('');
}