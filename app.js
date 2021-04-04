require('dotenv').config()
const SellingPartnerAPI = require('amazon-sp-api');
const prompt = require('prompt-validate');
var player = require('play-sound')(opts = {});
const ISBNAuditer = require('isbn3');
const fs = require('fs');

let sellingPartner = new SellingPartnerAPI({
    region: 'na', // The region of the selling partner API endpoint ("eu", "na" or "fe")
    refresh_token: process.env.REFRESH_TOKEN // The refresh token of your app user
});

const outFile = prompt('Out filename >> ');

async function main() {
    const ISBN = prompt('ISBN >> ', function (val) {
        if (val == 'stop') {
            process.exit();
        }
        if (val != undefined && val != '' && ISBNAuditer.audit(val).validIsbn == true) return true;
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
        var bestPrice = 0;

        if (books.Items.length == 1) {
            ASIN = books.Items[0].Identifiers.MarketplaceASIN.ASIN;
            var bestPricingData = await getCompetitivePricing([ASIN]);
            bestPrice = bestPricingData.bestPrice;
        } else {
            allTitles = [];
            books.Items.forEach(book => {
                allTitles.push(book.AttributeSets[0].Title);
            });
            const uniqueTitles = Array.from(new Set(allTitles))

            console.log(uniqueTitles);

            if (uniqueTitles.length > 1) {
                //Book titles are different
                playSound('attn.mp3');

                for (let i = 0; i < books.Items.length; i++) {
                    console.log(`[${i}] -> ${books.Items[i].AttributeSets[0].Title}`);
                }
                const choice = prompt('Which title is correct? >> ', function (val) {
                    if (val <= books.Items.length && val >= 0) return true
                    console.log('Please pick a number from the list...')
                });
                ASIN = books.Items[choice].Identifiers.MarketplaceASIN.ASIN;
                var bestPricingData = await getCompetitivePricing([ASIN]);
                bestPrice = bestPricingData.bestPrice;

            } else {
                //Book titles are the same. Find the one with the pricing. 
                allPrices = [];
                allASINs = [];
                books.Items.forEach(book => {
                    allASINs.push(book.Identifiers.MarketplaceASIN.ASIN);
                });

                var bestPricingData = await getCompetitivePricing(allASINs);
                ASIN = bestPricingData.ASIN;
                bestPrice = bestPricingData.bestPrice;
            }

        }

        console.log(`ASIN: ${ASIN}`);
        console.log(`Best price: ${bestPrice}`);

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

        console.log(`Total fees: ${fees.FeesEstimateResult.FeesEstimate.TotalFeesEstimate.Amount}`);

        const priceDifference = bestPrice - fees.FeesEstimateResult.FeesEstimate.TotalFeesEstimate.Amount;
        console.log(`Price difference: ${priceDifference}`);

        if (priceDifference > process.env.PRICE_THRESHOLD) {

            playSound('success.mp3');

            const condition = prompt('What is the condition? >> ', function (val) {
                if (true) return true
                console.log('Please pick a valid condition...')
            });

            fs.appendFileSync(outFile, `bookloader,sku,${ASIN},ASIN,,,,,,,,,${bestPrice},1,,,,,,,,,,,,,,${condition}\n`);

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

const median = arr => {
    const mid = Math.floor(arr.length / 2),
      nums = [...arr].sort((a, b) => a - b);
    return arr.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
  };

async function getCompetitivePricing(ASINS) {
    let pricing = await sellingPartner.callAPI({
        operation: 'getCompetitivePricing',
        query: {
            MarketplaceId: process.env.MARKET_ID,
            Asins: ASINS,
            ItemType: 'Asin'
        }
    });

    var allPrices = [];
    var validASINs = [];
    pricing.forEach(product => {
        product.Product.CompetitivePricing.CompetitivePrices.forEach(price => {
            if (price.Price.condition == 'Used') {
                allPrices.push(price.Price.LandedPrice.Amount);
                if (!validASINs.includes(product.ASIN)) {
                    validASINs.push(product.ASIN);
                }
            }
        });
    });

    if (allPrices.length == 0) {
        console.error('No pricing data available for used products, trying new...');

        pricing.forEach(product => {
            product.Product.CompetitivePricing.CompetitivePrices.forEach(price => {
                if (price.Price.condition == 'New') {
                    allPrices.push(price.Price.LandedPrice.Amount);
                    if (!validASINs.includes(product.ASIN)) {
                        validASINs.push(product.ASIN);
                    }
                }
            });
        });

        if (allPrices.length == 0) {
            console.error('No pricing data available, save for later?');
            playSound('attn.mp3');
            main();
        }
    }

    var correctASIN;
    if (validASINs.length > 1) {
        playSound('attn.mp3');
        for (let i = 0; i < validASINs.length; i++) {
            console.log(`[${i}] -> ${validASINs[i]}`);
        }

        const choice = prompt('Multiple ASINs! Which is correct? >> ', function (val) {
            if (val <= validASINs.length && val >= 0) return true
            console.log('Please pick a number from the list...')
        });

        correctASIN = validASINs[choice];
    } else {
        correctASIN = validASINs[0];
    }

    return {
        ASIN: correctASIN,
        //bestPrice: allPrices.reduce((a, b) => a + b, 0) / allPrices.length
        //bestPrice: median(allPrices),
        bestPrice: Math.min(...allPrices)
    }
}

main();
