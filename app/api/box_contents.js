require("dotenv").config();
const db = require("./db");

var mail_box_id = '';

async function getStartingSKU() {
    var lastRow = await db.query(
      "SELECT * FROM profitable_books WHERE sent = 1 AND mail_box_id IS NOT NULL ORDER BY id DESC LIMIT 0, 1"
    );
    if (lastRow.length > 0) {
        mail_box_id = lastRow[0].mail_box_id;
    }
    console.log(`Mail box is : ${mail_box_id}`);
  }

async function boxContents(FNSKU, socket) {

    if (FNSKU.startsWith('mail_box')) {
        mail_box_id = FNSKU;
        console.log(`New mail box: ${mail_box_id}`);
        socket.emit('logs', `New mail box: ${mail_box_id}`);
        socket.emit('mail_box_update', mail_box_id);
        socket.emit('success_sound');
    } else {
        const data = await db.query('UPDATE profitable_books SET mail_box_id = ? WHERE FNSKU = ? AND mail_box_id IS NULL', [mail_box_id,FNSKU]);
        if (data.changedRows > 1) {
            console.log('More than 1 row!');
            socket.emit('logs', 'More than 1 row!');
            socket.emit('fail_sound');
        } else if (data.changedRows == 0) {
            console.log('No FNSKU found...');
            socket.emit('logs', 'No FNSKU found...');
            socket.emit('fail_sound');
        }
        else if (data.warningCount > 0) {
            console.log('SQL Warning!');
            socket.emit('logs', 'SQL Warning!');
            socket.emit('logs', data.message);
            socket.emit('fail_sound');
        } else {
            socket.emit('logs', `Set ${FNSKU} to ${mail_box_id}`);
            socket.emit('success_sound');
        }
    }
}

getStartingSKU();

function getMailBox() {
    return mail_box_id;
}

module.exports = {
    boxContents: boxContents,
    getMailBox: getMailBox
}