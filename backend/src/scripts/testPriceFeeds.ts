import { ReyaService } from "../services/reya.js";
import { VertexService } from "../services/vertex.js";
import { merge } from "rxjs";

async function main() {
  console.log("Starting price feed test...");

  try {
    const reyaService = new ReyaService();
    const vertexService = new VertexService();

    console.log("\nConnecting to services...");
    await Promise.all([reyaService.connect(), vertexService.connect()]);
    console.log("Connected to both services");

    console.log("\nFetching available symbols...");
    const [reyaSymbols, vertexSymbols] = await Promise.all([
      reyaService.getAvailableSymbols(),
      vertexService.getAvailableSymbols(),
    ]);

    console.log("Reya available symbols:", reyaSymbols);
    console.log("Vertex available symbols:", vertexSymbols);

    // Find a common symbol (e.g., ETH)
    const commonSymbols = reyaSymbols.filter((symbol) =>
      vertexSymbols.some(
        (vs) => vs.replace("-PERP", "") === symbol.replace("-rUSD", "")
      )
    );

    if (commonSymbols.length === 0) {
      throw new Error("No common symbols found between Reya and Vertex");
    }

    const reyaSymbol = commonSymbols[1];
    const vertexSymbol = vertexSymbols.find(
      (vs) => vs.replace("-PERP", "") === reyaSymbol.replace("-rUSD", "")
    )!;

    console.log(
      `\nFound common symbol: ${reyaSymbol} (Reya) / ${vertexSymbol} (Vertex)`
    );
    console.log("Subscribing to price feeds from both services...");

    // Subscribe to both price feeds
    const subscription = merge(
      reyaService.getPriceStream(reyaSymbol),
      vertexService.getPriceStream(vertexSymbol)
    ).subscribe({
      next: (price) => {
        console.log(
          `[${price.source.toUpperCase()}] ${
            price.symbol
          }: $${price.price.toFixed(2)} @ ${new Date(
            price.timestamp
          ).toISOString()}`
        );
      },
      error: (error) => {
        console.error("Error in price stream:", error);
      },
    });

    // Run for 30 seconds then cleanup
    console.log("\nWatching prices for 30 seconds...");
    await new Promise((resolve) => setTimeout(resolve, 30000));

    // Cleanup
    console.log("\nCleaning up...");
    subscription.unsubscribe();
    reyaService.disconnect();
    vertexService.disconnect();
  } catch (error) {
    console.error("Error in test script:", error);
    console.error(
      "Error details:",
      error instanceof Error ? error.stack : error
    );
  }
}

// Run the test
main().catch((error) => {
  console.error("Fatal error:", error);
  console.error("Stack trace:", error instanceof Error ? error.stack : error);
  process.exit(1);
});
