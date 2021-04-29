const express = require("express");
const app = express();
const port = process.env.PORT || 3200;
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const tesseract = require("node-tesseract-ocr");

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

    OCR(req.file.path);

    return res.send({
      success: true,
    });
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

const config = {
  lang: "eng",
};
function OCR(path) {
  tesseract
    .recognize(path, config)
    .then((text) => {
      console.log("Result:", text);
      var isbn = text.match(
        /^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/gm
      );
      console.log(
        isbn[0].replace(/-/g, "").replace("ISBN", "").replace(" ", "")
      );
    })
    .catch((error) => {
      console.log(error.message);
    });
}
