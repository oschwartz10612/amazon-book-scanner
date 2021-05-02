require("dotenv").config();
const SellingPartnerAPI = require("amazon-sp-api");
const makeDb = require("../lib/db");

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

var sentSkus = [
];

var count = 0;

sentSkus.forEach(async (sku) => {
  try {
    await db.query("UPDATE profitable_books SET sent = TRUE WHERE SKU = ?", [
      sku,
    ]);
  } catch (error) {
    console.log(`There was a problem setting sql for ${sku}`);
  }
  count += 1;
  console.log(`${count} - ${sku}`);

  if (count == sentSkus.length) {
    process.exit(0);
  }
});
