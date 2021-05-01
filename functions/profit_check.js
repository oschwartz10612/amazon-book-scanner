require("dotenv").config();
const SellingPartnerAPI = require("amazon-sp-api");
const prompt = require("prompt-validate");
const ISBNAuditer = require("isbn3");
const makeDb = require("./lib/db");
const playSound = require("./lib/playSound");

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
    playSound("fail.mp3");
  });
  if (ISBN.startsWith("box") || ISBN.startsWith("value_box")) {
    return getISBN();
  } else {
    return ISBN;
  }
}

function setBox(box) {
  if (box.startsWith("box")) {
    unprofit_box = box;
    console.log(`Next box is: ${unprofit_box}`);
  } else if (box.startsWith("value_box")) {
    profit_box = box;
    console.log(`Next box is: ${profit_box}`);
  }
}

async function main(calledISBN, socket) {
  var ASIN = "";
  var title = "";
  var rank = 0;
  var bestPrice = 0;
  var ISBN = null;
  if (calledISBN == undefined) {
    ISBN = getISBN();
  } else {
    ISBN = calledISBN;
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

      var bestPricingData = await getCompetitivePricing([ASIN]);
      bestPrice = bestPricingData.bestPrice;
    } else {
      allTitles = [];
      books.Items.forEach((book) => {
        allTitles.push(book.AttributeSets[0].Title);
      });
      const uniqueTitles = Array.from(new Set(allTitles));

      console.log(uniqueTitles);

      if (uniqueTitles.length > 1) {
        //Book titles are different
        playSound("attn.mp3");

        for (let i = 0; i < books.Items.length; i++) {
          console.log(`[${i}] -> ${books.Items[i].AttributeSets[0].Title}`);
        }
        // const choice = prompt("Which title is correct? >> ", function (val) {
        //   if (val <= books.Items.length && val >= 0) return true;
        //   console.log("Please pick a number from the list...");
        // });

        socket.emit('prompt', 'Which title is correct?');

        const choice = await new Promise(resolve => {
          socket.once('promptRes', answer => {
            resolve(answer);
          });
        });

        ASIN = books.Items[choice].Identifiers.MarketplaceASIN.ASIN;
        title = books.Items[choice].AttributeSets[0].Title;
        rank = books.Items[choice].SalesRankings[0].Rank;
        var bestPricingData = await getCompetitivePricing([ASIN]);
        bestPrice = bestPricingData.bestPrice;
      } else {
        //Book titles are the same. Find the one with the pricing.
        allPrices = [];
        allASINs = [];
        books.Items.forEach((book) => {
          allASINs.push(book.Identifiers.MarketplaceASIN.ASIN);
        });

        var bestPricingData = await getCompetitivePricing(allASINs);
        ASIN = bestPricingData.ASIN;
        bestPrice = bestPricingData.bestPrice;
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

    if (typeof fee.Error == undefined) {
      console.error("Unable to find fee...");
      fee = bestPrice * 0.5;
    } else {
      fee = fees.FeesEstimateResult.FeesEstimate.TotalFeesEstimate.Amount;
    }

    console.log(`Total fees: ${fee}`);

    const priceDifference = bestPrice - fee;
    console.log(`Price difference: ${priceDifference}`);

    if (rank == undefined) {
      rank = "unknown";
    }

    if (
      priceDifference > process.env.PRICE_THRESHOLD &&
      rank < 10000000 &&
      rank != "unknown"
    ) {
      playSound("success.mp3");

      // const condition = prompt("What is the condition? >> ");

      socket.emit('prompt', 'What is the condition?');

      const condition = await new Promise(resolve => {
        socket.once('promptRes', answer => {
          resolve(answer);
        });
      });

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
      });
      lastId = insertedRow.insertId;
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
      });
      playSound("fail.mp3");
    }
  } else {
    playSound("fail.mp3");
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

async function getCompetitivePricing(ASINS) {
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
      console.error("No pricing data available, save for later?");
      playSound("attn.mp3");
      return;
    }
  }

  var correctASIN;
  if (validASINs.length > 1) {
    playSound("attn.mp3");
    for (let i = 0; i < validASINs.length; i++) {
      console.log(`[${i}] -> ${validASINs[i]}`);
    }

    // const choice = prompt(
    //   "Multiple ASINs! Which is correct? >> ",
    //   function (val) {
    //     if (val <= validASINs.length && val >= 0) return true;
    //     console.log("Please pick a number from the list...");
    //   }
    // );

    socket.emit('prompt', 'Which title is correct?');

    const choice = await new Promise(resolve => {
      socket.once('promptRes', answer => {
        resolve(answer);
      });
    });

    correctASIN = validASINs[choice];
  } else {
    correctASIN = validASINs[0];
  }

  //var bestPrice = Math.min(...allPrices);
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

  if (bestPrice == Infinity) {
    bestPrice = 0;
  }

  return {
    ASIN: correctASIN,

    bestPrice: bestPrice,
  };
}

getStartingSKU();

module.exports = {
  profitCheck: main,
  setBox: setBox
};
