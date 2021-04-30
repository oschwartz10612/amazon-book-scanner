
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const port = process.env.PORT || 3200;
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const tesseract = require("node-tesseract-ocr");
const profit_check = require("../profit_check");

var upload = multer({ dest: __dirname + "/uploads" });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('socketio', io);

app.use(express.static(__dirname + "/public"));
app.use(cors());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
app.get("/main", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "main.html"));
});
app.get("/image", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "image.html"));
});

io.on('connection', socket => {
  socket.on('isbn', async res => {
    profit_check.profitCheck(req.body.isbn, socket);
  });
});

app.post("/set_box", async (req, res) => {
  profit_check.setBox(req.body.box);
  res.sendStatus(200, 'OK');
});

var type = upload.single("image");
app.post("/image", type, (req, res) => {
  if (!req.file) {
    console.log("No file received");
    return res.send({
      success: false,
    });
  } else {
    console.log("file received");

    OCR(req.file.path);

    return res.send({
      success: true,
    });
  }
});

server.listen(port);

const config = {
  lang: "eng",
};
async function OCR(path) {
  try {
    const text = await tesseract.recognize(path, config);
    console.log(text);

    const ISBNs = text.match(
      /(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}|97[89][0-9]{10}|(?=(?:[0-9]+[- ]){4})[- 0-9]{17})(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]/gm
    );
    if (ISBNs != null) {
      const ISBN = ISBNs[0].replace(/\s|[-]|[ISBN]|[isbn]|[:]/g,'');

      console.log(ISBN);
      profit_check.profitCheck(ISBN);

    } else {
      console.log('Need to look harder...');
    }
    
  } catch (error) {
    console.error(error.message);
  }
}
