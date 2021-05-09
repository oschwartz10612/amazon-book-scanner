
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const port = process.env.PORT || 3200;
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const tesseract = require("node-tesseract-ocr");
const profit_check = require("./profit_check");

var globalSocket = null;

io.on('connection', socket => {
  socket.emit('fail_box_update', profit_check.getUnprofitBox());
  socket.emit('success_box_update', profit_check.getProfitBox());

  globalSocket = socket;

  socket.on('isbn', async req => {
    profit_check.profitCheck(req, socket);
  });

  socket.on('set_box', async req => {
    profit_check.setBox(req, socket);
  });
});

var upload = multer({ dest: __dirname + "/uploads" });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('socketio', io);

app.use(express.static(__dirname + "/public"));
app.use(cors());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});
app.get("/main", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "main.html"));
});
app.get("/image", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "image.html"));
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
      profit_check.profitCheck(ISBN, globalSocket);

    } else {
      console.log('Need to look harder...');
      globalSocket.emit('fail_sound');
    }
    
  } catch (error) {
    console.error(error.message);
  }
}
