const SellingPartnerAPI = require("amazon-sp-api");
const sellingPartner = new SellingPartnerAPI({
  region: "na", // The region of the selling partner API endpoint ("eu", "na" or "fe")
  refresh_token: process.env.REFRESH_TOKEN, // The refresh token of your app user
});

module.exports = sellingPartner;