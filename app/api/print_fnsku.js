require("dotenv").config();
const prompt = require("prompt-validate");
const PDFDocument = require('pdfkit');
const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const path = require('path');
const db = require('./db');
var Encoder = require("code-128-encoder")
var encoder= new Encoder()

toPrint = [];
var index = 1;
var page = 0;

async function printFNSKU(ISBN, socket) {
    //const ISBN = prompt('ISBN >> ');
    if (ISBN == 'stop') {
        process.exit(0);
    } else {
        const data = await db.query('SELECT id, title, FNSKU from profitable_books WHERE ISBN = ? AND FNSKU IS NOT NULL AND mail_box_id IS NULL', [ISBN]);
        if (data.length > 1) {
            socket.emit("fail_sound");

            console.log('More than 1 row!');
            socket.emit('logs', 'More than 1 row!');
            data.forEach(row => {
                socket.emit('logs', row.title);
            });

            return;
        } else if (data.length == 0) {
            socket.emit("fail_sound");
            socket.emit('logs', 'Not known ISBN...');
            console.log('Not known ISBN...');
            return;

        } else {
            socket.emit('logs', data[0].title);
            socket.emit('logs', data[0].FNSKU);
            socket.emit("success_sound");

            if (toPrint.length == 2) {
                toPrint.push(data[0].FNSKU);
                await printPage(socket);
                page += 1;
                socket.emit('print_fnsku_vals_update', {page: page, index: index});
                toPrint = [];
                return;
            } else {
                toPrint.push(data[0].FNSKU);
                return;
            }
        }
    }
}

async function printPage(socket) {

    if (page >= 3) {
        socket.emit("attn_sound");

        index += 1;

        const question = ['Reload labels...', 'Done'];
        socket.emit("prompt", question);
        await new Promise((resolve) => {
            socket.once("promptRes", (answer) => {
              resolve(answer);
            });
          });

        page = 0;
        socket.emit('print_fnsku_vals_update', {page: page, index: index});
    }

    const id = makeid(5);
    const doc = new PDFDocument();
    var pdfStream = fs.createWriteStream(path.join(__dirname, `./output/output${id}.pdf`));
    const reverseToPrint = toPrint.reverse();

    doc.font('./fonts/LibreBarcode128Text-Regular.ttf').fontSize(34);
    const string1 = encoder.encode(reverseToPrint[0]);
    const string2 = encoder.encode(reverseToPrint[1]);
    const string3 = encoder.encode(reverseToPrint[2]);

    doc.text(string1, 104 - (doc.widthOfString(string1) / 2), ((72*index) - (doc.heightOfString(string1) / 2)), {
        width: doc.page.width
    });
    doc.text(string2, 304 - (doc.widthOfString(string2) / 2), ((72*index) - (doc.heightOfString(string2) / 2)), {
        width: doc.page.width
    });
    doc.text(string3, 504 - (doc.widthOfString(string3) / 2), ((72*index) - (doc.heightOfString(string3) / 2)), {
        width: doc.page.width
    });

    doc.pipe(pdfStream)
    doc.end();

    socket.emit("attn_sound");

    console.log(`Waiting for pdf page ${page}`);
    return new Promise((resolve, reject) => {
        pdfStream.addListener('finish', async () => {
            console.log(`Printing pdf page ${page}`);
            socket.emit('logs', `Printing pdf page ${page}`);
            socket.emit('print_id', id);
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

function getPage() {
    return page;
}

function getIndex() {
    return index;
}

function setVals(i, p) {
    index = parseInt(i);
    page = parseInt(p);
}

module.exports = {
    printFNSKU: printFNSKU,
    setVals: setVals,
    getPage: getPage,
    getIndex: getIndex
}