require("dotenv").config();
const SellingPartnerAPI = require("amazon-sp-api");
const makeDb = require("../lib/db");
const { printTable } = require('console-table-printer');

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

var updateDatabase = 'unprofitable_books';

(async () => {

    const data = await db.query(`SELECT id, title, ASIN FROM ${updateDatabase} WHERE merchant_offer_count IS NULL AND ASIN IS NOT NULL LIMIT 180`);
    console.log(data.length);

    if (data.length < 10) {
        printTable(data);
    }

    var count = 0;

    data.forEach(async book => {

        //await delay(100);

        var lowAmazon = null;
        var lowMerchant = null;

        var numAmazon = null;
        var numMerchant = null;

        const pricing = await sellingPartner.callAPI({
            operation: "getItemOffers",
            query: {
                MarketplaceId: process.env.MARKET_ID,
                ItemCondition: 'Used'
            },
            path: {
                Asin: book.ASIN
            }
        });

        try {
            pricing.Summary.LowestPrices.forEach(price => {
                if (price.fulfillmentChannel == 'Merchant') {
                    if (lowMerchant == null) {
                        lowMerchant = price.LandedPrice.Amount
                    }
                } else if(price.fulfillmentChannel == 'Amazon') {
                    if (lowAmazon == null) {
                        lowAmazon = price.LandedPrice.Amount
                    }
                }
            });  

            pricing.Summary.NumberOfOffers.forEach(offer => {
                if (offer.fulfillmentChannel == 'Merchant') {
                    if (numMerchant == null) {
                        numMerchant = offer.OfferCount
                    }
                } else if (offer.fulfillmentChannel == 'Amazon') {
                    if (numAmazon == null) {
                        numAmazon = offer.OfferCount
                    } 
                } 
            });
            
    
            // console.log(lowMerchant);
            // console.log(lowAmazon);
            // console.log(numAmazon);
            // console.log(numMerchant);
            // console.log('----');
    
            await db.query(`UPDATE ${updateDatabase} SET ? WHERE id=?`, [{
                low_amazon: lowAmazon,
                low_merchant: lowMerchant,
                amazon_offer_count: numAmazon,
                merchant_offer_count: numMerchant
            }, book.id]);

        } catch {
            console.log("Data not available");
        }



        count += 1;

        console.log(`${book.id} - ${count}`);
        if (count == data.length) {
            process.exit(0)
        }

        //console.log(JSON.stringify(pricing, null, 2));

    });
//console.log('Done');

})();