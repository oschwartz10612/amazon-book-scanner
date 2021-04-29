const express = require("express");
const app = express();
const port = process.env.PORT || 3200;
const cors = require("cors");
const multer = require("multer");
const path = require('path');

var upload = multer({ dest: __dirname + "/uploads" });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
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

    return res.send({
      success: true,
    });
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
