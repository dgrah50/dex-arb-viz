import { HyperliquidService } from "../services/hyperliquid.js";

async function testHyperliquidService() {
  console.log("Testing Hyperliquid service...");

  const hyperliquidService = new HyperliquidService();

  try {
    // Test connection
    console.log("Connecting to Hyperliquid...");
    await hyperliquidService.connect();
    console.log("✅ Connected successfully");

    // Test getting available symbols
    console.log("Fetching available symbols...");
    const symbols = await hyperliquidService.getAvailableSymbols();
    console.log("✅ Available symbols:", symbols.slice(0, 10)); // Show first 10

    // Test price stream for a popular symbol (if available)
    if (symbols.length > 0) {
      const testSymbol = symbols.find((s) => s === "BTC") || symbols[0];
      console.log(`Testing price stream for ${testSymbol}...`);

      const priceStream = hyperliquidService.getPriceStream(testSymbol);

      // Subscribe to a few price updates
      let updateCount = 0;
      const subscription = priceStream.subscribe({
        next: (priceData) => {
          updateCount++;
          console.log(`✅ Price update ${updateCount}:`, {
            symbol: priceData.symbol,
            price: priceData.price,
            source: priceData.source,
            timestamp: new Date(priceData.timestamp).toISOString(),
          });

          // Stop after 3 updates
          if (updateCount >= 3) {
            subscription.unsubscribe();
            hyperliquidService.disconnect();
            console.log("✅ Test completed successfully!");
            process.exit(0);
          }
        },
        error: (error) => {
          console.error("❌ Error in price stream:", error);
          hyperliquidService.disconnect();
          process.exit(1);
        },
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        console.log("⏰ Test timeout - disconnecting");
        subscription.unsubscribe();
        hyperliquidService.disconnect();
        process.exit(0);
      }, 10000);
    } else {
      console.log("❌ No symbols available");
      hyperliquidService.disconnect();
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
    hyperliquidService.disconnect();
    process.exit(1);
  }
}

// Run the test
testHyperliquidService().catch(console.error);
