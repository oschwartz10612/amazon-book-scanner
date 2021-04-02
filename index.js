require('dotenv').config()
const SellingPartnerAPI = require('amazon-sp-api');

let sellingPartner = new SellingPartnerAPI({
    region:'eu', // The region of the selling partner API endpoint ("eu", "na" or "fe")
    refresh_token:'<YOUR_REFRESH_TOKEN>' // The refresh token of your app user
  });