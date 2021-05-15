require("dotenv").config();
const db = require("./db");
const sellingPartner = require("./sp");

async function getFNSKU(socket) {
  const data = await db.query(
    "SELECT * FROM profitable_books WHERE FNSKU IS NULL AND sent = 1 LIMIT 50"
  );
  const SKUs = data.map((book) => book.SKU);
  console.log(SKUs.length);
  socket.emit("logs", `Items to update from database: ${SKUs.length}`);

  if (SKUs.length > 0) {
    var count = 0;

    const summary = await sellingPartner.callAPI({
      operation: "getInventorySummaries",
      query: {
        marketplaceIds: [process.env.MARKET_ID],
        granularityId: process.env.MARKET_ID,
        granularityType: "Marketplace",
        sellerSkus: SKUs,
      },
    });
    
    console.log(summary.inventorySummaries.length);
    socket.emit("logs", summary.inventorySummaries.length);

    summary.inventorySummaries.forEach(async (item) => {
      try {
        await db.query("UPDATE profitable_books SET FNSKU = ? WHERE SKU = ?", [
          item.fnSku,
          item.sellerSku,
        ]);
      } catch (error) {
        console.log(`There was a problem setting sql for ${item.sellerSku}`);
      }
      count += 1;
      console.log(`${count} - ${item.sellerSku}`);
      socket.emit("logs", `${count} - ${item.sellerSku}`);
    });
  } else {
    socket.emit("logs", "Nothing to update...");
  }

}

module.exports = {
  getFNSKU: getFNSKU,
};
