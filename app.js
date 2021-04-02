require('dotenv').config()
const SellingPartnerAPI = require('amazon-sp-api');
const prompt = require('prompt-validate');
var player = require('play-sound')(opts = {});
const ISBNAuditer = require('isbn3');

let sellingPartner = new SellingPartnerAPI({
    region: 'na', // The region of the selling partner API endpoint ("eu", "na" or "fe")
    refresh_token: process.env.REFRESH_TOKEN // The refresh token of your app user
});

async function main() {
    const ISBN = prompt('ISBN >> ', function (val) {
        if (val == 'stop') {
            process.exit();
        }
        if (ISBNAuditer.audit(val).validIsbn == true) return true;
        console.log('Please enter a valid ISBN...')
        playSound('fail.mp3');
       });



    //Get catalog item
    let books = await sellingPartner.callAPI({
        operation: 'listCatalogItems',
        query: {
            MarketplaceId: process.env.MARKET_ID,
            ISBN: ISBN
        }
    });

    if (books.Items.length > 0) {
        var ASIN = '';

        //prompt for choice of right title

        if (books.Items.length == 1) {
            ASIN = books.Items[0].Identifiers.MarketplaceASIN.ASIN;
        } else {
            playSound('attn.mp3');
            for (let i = 0; i < books.Items.length; i++) {
                console.log(`[${i}] -> ${books.Items[i].AttributeSets[0].Title}`);
            }
            const choice = prompt('Which title is correct? >> ', function (val) {
                if (val <= books.Items.length && val >= 0) return true
                console.log('Please pick a number from the list...')
               });
            
            ASIN = books.Items[choice].Identifiers.MarketplaceASIN.ASIN;
        }

        console.log(`ASIN: ${ASIN}`);

        let pricing = await sellingPartner.callAPI({
            operation: 'getCompetitivePricing',
            query: {
                MarketplaceId: process.env.MARKET_ID,
                Asins: [ASIN],
                ItemType: 'Asin'
            }
        });

        var allPrices = [];
        var priceDifference = 0;
        pricing[0].Product.CompetitivePricing.CompetitivePrices.forEach(price => {
            if (price.Price.condition == 'Used') {
                allPrices.push(price.Price.LandedPrice.Amount);
            }
        });
        console.log(allPrices);
        if (allPrices.length > 0) {
            const bestPrice = Math.max(...allPrices);

            let fees = await sellingPartner.callAPI({
                operation: 'getMyFeesEstimateForASIN',
                path: {
                    Asin: ASIN
                },
                body: {
                    FeesEstimateRequest: {
                        MarketplaceId: process.env.MARKET_ID,
                        IsAmazonFulfilled: true,
                        PriceToEstimateFees: {
                            ListingPrice: {
                                CurrencyCode: 'USD',
                                Amount: bestPrice
                            }
                        },
                        Identifier: 'ggdfgsdggg'
                    }
                }
            });


            console.log(`Best price: ${bestPrice}`);
            console.log(`Total fees: ${fees.FeesEstimateResult.FeesEstimate.TotalFeesEstimate.Amount}`);

            priceDifference = bestPrice - fees.FeesEstimateResult.FeesEstimate.TotalFeesEstimate.Amount;

        } else {
            priceDifference = 25;
            console.log('No price data to compare.');
        }

        console.log(`Price difference: ${priceDifference}`);

        if (priceDifference > process.env.PRICE_THRESHOLD) {
            //create listing

            playSound('success.mp3');
        } else {
            playSound('fail.mp3')
        }

    } else {
        player.play('assets/fail.mp3', function (err) {
            if (err) console.log(`Could not play audio: ${err}`)
        })
        console.warn('No item found!');

    }

    main();
}

function playSound(file) {
    player.play(`assets/${file}`, function (err) {
        if (err) console.log(`Could not play audio: ${err}`)
    })
}

main();
