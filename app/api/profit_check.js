require("dotenv").config();
const SellingPartnerAPI = require("amazon-sp-api");
const prompt = require("prompt-validate");
const ISBNAuditer = require("isbn3");
const makeDb = require("./db");

let sellingPartner = new SellingPartnerAPI({
  region: "na", // The region of the selling partner API endpoint ("eu", "na" or "fe")
  refresh_token: process.env.REFRESH_TOKEN, // The refresh token of your app user
});

var lastId = 0;
var profit_box = "value_box0";
var unprofit_box = "box0";

const db = makeDb({
  host: process.env.MYSQL_DOMAIN,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASS,
  database: process.env.MYSQL_DATABASE,
});

async function getStartingSKU() {
  var lastRow = await db.query(
    "SELECT * FROM profitable_books ORDER BY id DESC LIMIT 0, 1"
  );
  if (lastRow.length > 0) {
    profit_box = lastRow[0].box_id;
    lastId = lastRow[0].id;
  }
  lastRow = await db.query(
    "SELECT * FROM unprofitable_books ORDER BY id DESC LIMIT 0, 1"
  );
  if (lastRow.length > 0) {
    unprofit_box = lastRow[0].box_id;
  }
  console.log(`Value box is : ${profit_box}`);
  console.log(`Failure box is : ${unprofit_box}`);
}

function getISBN() {
  const ISBN = prompt("ISBN >> ", function (val) {
    if (val == "stop") {
      process.exit();
    } else if (val.startsWith("box")) {
      unprofit_box = val;
      console.log(`Next box is: ${unprofit_box}`);
      return true;
    } else if (val.startsWith("value_box")) {
      profit_box = val;
      console.log(`Next box is: ${profit_box}`);
      return true;
    } else if (
      val != undefined &&
      val != "" &&
      ISBNAuditer.audit(val).validIsbn == true
    ) {
      return true;
    }

    console.log("Please enter a valid ISBN...");
    socket.emit('logs', "Please enter a valid ISBN...");
    socket.emit("fail_sound");
  });
  if (ISBN.startsWith("box") || ISBN.startsWith("value_box")) {
    return getISBN();
  } else {
    return ISBN;
  }
}

function setBox(box, socket) {
  if (box.startsWith("box")) {
    unprofit_box = box;
    socket.emit("fail_box_update", unprofit_box);
    console.log(`Next box is: ${unprofit_box}`);
    socket.emit("success_sound");
  } else if (box.startsWith("value_box")) {
    profit_box = box;
    socket.emit("success_box_update", profit_box);
    console.log(`Next box is: ${profit_box}`);
    socket.emit("success_sound");
  } else {
    socket.emit("fail_sound");
  }
}

async function main(calledISBN, socket) {
  var ASIN = null;
  var title = null;
  var rank = 0;
  var bestPrice = 0;
  var ISBN = null;
  var uniqueTitles = null;
  if (calledISBN == undefined) {
    ISBN = getISBN();
  } else if (calledISBN != '' && ISBNAuditer.audit(calledISBN).validIsbn) {
    ISBN = calledISBN;
  } else {
    console.log("No valid ISBN supplied...");
    socket.emit('logs', "No valid ISBN supplied...");
    socket.emit("fail_sound");
    return;
  }

  //Get catalog item
  let books = await sellingPartner.callAPI({
    operation: "listCatalogItems",
    query: {
      MarketplaceId: process.env.MARKET_ID,
      ISBN: ISBN,
    },
  });

  if (books.Items.length > 0) {
    if (books.Items.length == 1) {
      ASIN = books.Items[0].Identifiers.MarketplaceASIN.ASIN;
      title = books.Items[0].AttributeSets[0].Title;
      const SalesRankings = books.Items[0].SalesRankings[0];
      rank = SalesRankings ? SalesRankings.Rank : undefined;

      try{
        var bestPricingData = await getCompetitivePricing([ASIN], socket);
        bestPrice = bestPricingData.bestPrice;
      } catch (error) {
        socket.emit('fail_sound');
        socket.emit('logs', error.message);
        return;
      }

    } else {
      allTitles = [];
      books.Items.forEach((book) => {
        allTitles.push(book.AttributeSets[0].Title);
      });
      uniqueTitles = Array.from(new Set(allTitles));

      console.log(uniqueTitles);

      if (uniqueTitles.length > 1) {

        socket.emit("attn_sound");

        var question = ["Which title is correct?"];
        for (let i = 0; i < books.Items.length; i++) {
          console.log(`[${i}] -> ${books.Items[i].AttributeSets[0].Title}`);
          question.push(books.Items[i].AttributeSets[0].Title);
        }
        
        socket.emit("prompt", question);

        const choice = await new Promise((resolve) => {
          socket.once("promptRes", (answer) => {
            resolve(answer);
          });
        });

        ASIN = books.Items[choice].Identifiers.MarketplaceASIN.ASIN;
        title = books.Items[choice].AttributeSets[0].Title;

        if (books.Items[choice].SalesRankings[0] == undefined && uniqueTitles != null && uniqueTitles.length > 1) {
          main(ISBN, socket);
          return;
        } else {
          rank = books.Items[choice].SalesRankings[0].Rank;
        }

        try {
          var bestPricingData = await getCompetitivePricing([ASIN], socket);
          bestPrice = bestPricingData.bestPrice;
        } catch (error) {
          socket.emit('fail_sound');
          socket.emit('logs', error.message);
          return;
        }

      } else {
        //Book titles are the same. Find the one with the pricing.
        allPrices = [];
        allASINs = [];
        books.Items.forEach((book) => {
          allASINs.push(book.Identifiers.MarketplaceASIN.ASIN);
        });

        try {
          var bestPricingData = await getCompetitivePricing(allASINs, socket);
          ASIN = bestPricingData.ASIN;
          bestPrice = bestPricingData.bestPrice;
        } catch (error) {
          socket.emit('fail_sound');
          socket.emit('logs', error.message);
          return;
        }

        books.Items.forEach((book) => {
          if (book.Identifiers.MarketplaceASIN.ASIN == ASIN) {
            title = book.AttributeSets[0].Title;
            if (typeof book.SalesRankings[0].Rank != undefined) {
              rank = book.SalesRankings[0].Rank;
            }
          }
        });
      }
    }

    console.log(`ASIN: ${ASIN}`);
    console.log(`Best price: ${bestPrice}`);
    socket.emit('logs', title);
    socket.emit('logs', `ISBN: ${ISBN}`);
    socket.emit('logs', `ASIN: ${ASIN}`);
    socket.emit('logs', `Best price: ${bestPrice}`);

    let fees = await sellingPartner.callAPI({
      operation: "getMyFeesEstimateForASIN",
      path: {
        Asin: ASIN,
      },
      body: {
        FeesEstimateRequest: {
          MarketplaceId: process.env.MARKET_ID,
          IsAmazonFulfilled: true,
          PriceToEstimateFees: {
            ListingPrice: {
              CurrencyCode: "USD",
              Amount: bestPrice,
            },
          },
          Identifier: `${profit_box}_rb${lastId + 1}-fee`,
        },
      },
    });

    var fee = 0;

    if (typeof fee.Error == undefined || fees.FeesEstimateResult.Status != "Success") {
      console.log("Unable to find fee...");
      if (uniqueTitles != null && uniqueTitles.length > 1) {
        socket.emit('logs', "Unable to find fee. Trying again...");
        main(ISBN, socket);
        return;
      } else { 
        fee = bestPrice * .5;
      }
      
    } else {
      fee = fees.FeesEstimateResult.FeesEstimate.TotalFeesEstimate.Amount;
    }
    
    console.log(`Total fees: ${fee}`);
    socket.emit('logs', `Total fees: ${fee}`);

    console.log(`Rank: ${rank}`);
    socket.emit('logs', `Rank: ${rank}`);

    const priceDifference = bestPrice - fee;
    console.log(`Price difference: ${priceDifference}`);
    socket.emit('logs', `Price difference: ${priceDifference}`);

    if (rank == undefined) {
      rank = "unknown";
    }

    //Get offer data
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
            Asin: ASIN
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

    } catch {
        console.log("Data not available");
        socket.emit('logs', "Data not available");
    }

    if (
      (priceDifference > 5 &&
        rank < 1000000 &&
        rank != "unknown") ||
      (priceDifference > 9 &&
        rank > 1000000 &&
        rank < 4000000 &&
        rank != "unknown") ||
      (priceDifference > 13 &&
        rank > 4000000 &&
        rank < 6000000 &&
        rank != "unknown") ||
      (priceDifference > 18 &&
        rank > 6000000 &&
        rank < 10000000 &&
        rank != "unknown") ||
      (priceDifference > 50) ||
      (lowAmazon > 50 && numAmazon < 2 && rank < 4000000) ||
      (lowAmazon == null && numMerchant < 10 && lowMerchant > 10 && rank < 4000000)
    ) {
      socket.emit("success_sound");

      var question = ["What is the condition?", "Like New", "Very Good", "Good", "Acceptable"];
      socket.emit("prompt", question);
      const choiceIndex = await new Promise((resolve) => {
        socket.once("promptRes", (answer) => {
          resolve(answer);
        });
      });
      const conditions = ["Used - Like New", "Used - Very Good", "Used - Good", "Used - Acceptable"];
      const condition = conditions[choiceIndex];

      const insertedRow = await db.query("INSERT INTO profitable_books SET ?", {
        SKU: `${profit_box}_rb${lastId + 1}`,
        box_id: profit_box,
        ISBN: ISBN,
        ASIN: ASIN,
        title: title,
        condition: condition,
        profit: priceDifference,
        best_price: bestPrice,
        fee: fee,
        rank: rank,
        low_amazon: lowAmazon,
        low_merchant: lowMerchant,
        amazon_offer_count: numAmazon,
        merchant_offer_count: numMerchant
      });
      lastId = insertedRow.insertId;
      socket.emit('success_sound');
    } else {
      await db.query("INSERT INTO unprofitable_books SET ?", {
        box_id: unprofit_box,
        ISBN: ISBN,
        ASIN: ASIN,
        title: title,
        profit: priceDifference,
        best_price: bestPrice,
        fee: fee,
        rank: rank,
        low_amazon: lowAmazon,
        low_merchant: lowMerchant,
        amazon_offer_count: numAmazon,
        merchant_offer_count: numMerchant
      });
      socket.emit("fail_sound");
    }
  } else {
    socket.emit("fail_sound");

    await db.query("INSERT INTO unprofitable_books SET ?", {
      box_id: unprofit_box,
      ISBN: ISBN,
    });
    console.warn("No item found!");
  }
}

const median = (arr) => {
  const mid = Math.floor(arr.length / 2),
    nums = [...arr].sort((a, b) => a - b);
  return arr.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
};

async function getCompetitivePricing(ASINS, socket) {
  let pricing = await sellingPartner.callAPI({
    operation: "getCompetitivePricing",
    query: {
      MarketplaceId: process.env.MARKET_ID,
      Asins: ASINS,
      ItemType: "Asin",
    },
  });

  var allPrices = [];
  var validASINs = [];
  pricing.forEach((product) => {
    product.Product.CompetitivePricing.CompetitivePrices.forEach((price) => {
      if (price.Price.condition == "Used") {
        allPrices.push(price.Price.LandedPrice.Amount);
        if (!validASINs.includes(product.ASIN)) {
          validASINs.push(product.ASIN);
        }
      }
    });
  });

  if (allPrices.length == 0) {
    console.error("No pricing data available for used products, trying new...");
    socket.emit('logs', "No pricing data available for used products, trying new...");

    pricing.forEach((product) => {
      product.Product.CompetitivePricing.CompetitivePrices.forEach((price) => {
        if (price.Price.condition == "New") {
          allPrices.push(price.Price.LandedPrice.Amount);
          if (!validASINs.includes(product.ASIN)) {
            validASINs.push(product.ASIN);
          }
        }
      });
    });

    if (allPrices.length == 0) {
      throw new Error('No pricing data available, save for later?');
    }
  }

  var correctASIN;
  if (validASINs.length > 1) {
    socket.emit("attn_sound");

    var question = ["Which ASIN is correct?"];
    for (let i = 0; i < validASINs.length; i++) {
      console.log(`[${i}] -> ${validASINs[i]}`);
      question.push(validASINs[i]);
    }

    socket.emit("prompt", question);

    const choice = await new Promise((resolve) => {
      socket.once("promptRes", (answer) => {
        resolve(answer);
      });
    });

    correctASIN = validASINs[choice];
  } else {
    correctASIN = validASINs[0];
  }

  var i =
    Math.round(allPrices.length * 0.3) == 0
      ? 1
      : Math.round(allPrices.length * 0.3);
  var total = 0;
  for (let a = 0; a < i; a++) {
    console.log(allPrices[a]);
    total += allPrices[a];
  }
  const bestPrice = total / i;

  if (
    bestPrice == Infinity ||
    bestPrice == NaN ||
    bestPrice == null ||
    bestPrice == undefined
  ) {
    bestPrice = 0;
  }

  return {
    ASIN: correctASIN,

    bestPrice: bestPrice,
  };
}

getStartingSKU();

function getUnprofitBox() {
  return unprofit_box;
}

function getProfitBox() {
  return profit_box;
}

module.exports = {
  profitCheck: main,
  setBox: setBox,
  getUnprofitBox: getUnprofitBox,
  getProfitBox: getProfitBox,
};
