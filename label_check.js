require("dotenv").config();
const SellingPartnerAPI = require("amazon-sp-api");
const prompt = require("prompt-validate");
var player = require("play-sound")((opts = {}));
const ISBNAuditer = require("isbn3");
const util = require("util");
const mysql = require("mysql");
const delay = require('delay');
const { exec } = require("child_process");

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

function playSound(file) {
    if(process.argv[2] == 'andriod') {
        exec(`play-audio assets/${file}`, (error, stdout, stderr) => {
            if (error) {
                console.log(`error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.log(`stderr: ${stderr}`);
                return;
            }
        });
    } else {
        player.play(`assets/${file}`, function (err) {
            if (err) console.log(`Could not play audio: ${err}`);
          });
    }
  }