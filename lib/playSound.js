const { exec } = require("child_process");
var player = require("play-sound")((opts = {}));
function playSound(file) {
    if(process.argv[2] == 'android') {
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

  module.exports = playSound;