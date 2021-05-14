
const express = require('express');
const app = express();
const server = require('http').createServer(app);

const cors = require("cors");
const multer = require("multer");
const path = require("path");
const tesseract = require("node-tesseract-ocr");
const profit_check = require("./profit_check");
const print_fnsku = require("./print_fnsku");

const PORT = process.env.PORT || 3200;
const HOST = "0.0.0.0";

var globalSocket = null;

const io = require('socket.io')(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
io.on('connection', socket => {
  console.log(profit_check.unprofit_box);
  socket.emit('fail_box_update', profit_check.getUnprofitBox());
  socket.emit('success_box_update', profit_check.getProfitBox());
  socket.emit('print_fnsku_vals_update', {page: print_fnsku.getPage(), index: print_fnsku.getIndex()});

  socket.on('isbn', async req => {
    profit_check.profitCheck(req, socket);
  });

  socket.on('set_box', async req => {
    profit_check.setBox(req, socket);
  });

  socket.on('id_global', async req => {
    globalSocket = socket;
  });
  
  socket.on('print_fnsku', async req => {
    print_fnsku.printFNSKU(req, socket);
  });

  socket.on('print_fnsku_vals', async req => {
    print_fnsku.setVals(req.index, req.page);
    console.log(req.page);
  });
});

var upload = multer({ dest: __dirname + "/uploads" });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('socketio', io);

app.use(cors());

app.use('/output', express.static(path.join(__dirname, 'output')));
app.get('*.*', express.static(`${__dirname}/../dashboard/dist/app`));

app.get('*', function (req, res) {
    res.status(200).sendFile(`/`, {root: `${__dirname}/../dashboard/dist/app`});
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
    globalSocket.emit('refresh_logs');
    globalSocket.emit('logs', 'File received');

    OCR(req.file.path);

    return res.send({
      success: true,
    });
  }
});

server.listen(PORT, HOST);
console.log(`Server listening on port ${PORT} at ${HOST}`);

const config = {
  lang: "eng",
};
async function OCR(path) {
  try {
    const text = await tesseract.recognize(path, config);
    console.log(text);
    globalSocket.emit('logs', text);

    const ISBNs = text.match(
      /(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}|97[89][0-9]{10}|(?=(?:[0-9]+[- ]){4})[- 0-9]{17})(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]/gm
    );
    if (ISBNs != null) {
      const ISBN = ISBNs[0].replace(/\s|[-]|[ISBN]|[isbn]|[:]/g,'');

      console.log(ISBN);
      globalSocket.emit('logs', ISBN);
      profit_check.profitCheck(ISBN, globalSocket);

    } else {
      console.log('Need to look harder...');
      globalSocket.emit('logs', "Need to look harder...");

      globalSocket.emit('fail_sound');
    }
    
  } catch (error) {
    console.error(error.message);
  }
}
