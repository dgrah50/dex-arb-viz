import express, { Request, Response } from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import { merge } from "rxjs";
import { ReyaService } from "./services/reya.js";
import { HyperliquidService } from "./services/hyperliquid.js";
import { map } from "rxjs/operators";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Price {
  symbol: string;
  price: number;
  timestamp: number;
  source: string;
}

const startServer = async () => {
  const app = express();
  const reyaService = new ReyaService();
  const hyperliquidService = new HyperliquidService();

  app.use(
    cors({
      origin: "http://localhost:5173",
      credentials: true,
    })
  );

  app.use(express.static(path.join(__dirname, "../../public")));

  // Connect to services with error handling
  let reyaSymbols: string[] = [];
  let hyperliquidSymbols: string[] = [];

  try {
    await reyaService.connect();
    reyaSymbols = await reyaService.getAvailableSymbols();
    console.log("✅ Reya service connected successfully");
  } catch (error) {
    console.error("❌ Failed to connect to Reya:", error);
  }

  try {
    await hyperliquidService.connect();
    hyperliquidSymbols = await hyperliquidService.getAvailableSymbols();
    console.log("✅ Hyperliquid service connected successfully");
  } catch (error) {
    console.error("❌ Failed to connect to Hyperliquid:", error);
  }

  // Find common symbols between both services, or use available services
  let SUPPORTED_SYMBOLS: Array<{
    reyaSymbol?: string;
    baseSymbol: string;
    hyperliquidSymbol: string;
  }>;

  if (reyaSymbols.length > 0 && hyperliquidSymbols.length > 0) {
    // Both services available - find common symbols
    SUPPORTED_SYMBOLS = [];

    for (const reyaSymbol of reyaSymbols) {
      // Convert Reya symbol (e.g., "DOGE-rUSD") to base symbol (e.g., "DOGE")
      const baseSymbol = reyaSymbol.replace("-rUSD", "");

      // Find matching Hyperliquid symbol
      const hyperliquidSymbol = hyperliquidSymbols.find(
        (symbol) => symbol.toUpperCase() === baseSymbol.toUpperCase()
      );

      if (hyperliquidSymbol) {
        SUPPORTED_SYMBOLS.push({
          reyaSymbol,
          baseSymbol,
          hyperliquidSymbol,
        });
      }
    }
  } else if (hyperliquidSymbols.length > 0) {
    // Only Hyperliquid available
    SUPPORTED_SYMBOLS = hyperliquidSymbols.map((symbol) => ({
      baseSymbol: symbol,
      hyperliquidSymbol: symbol,
    }));
  } else {
    // No services available
    SUPPORTED_SYMBOLS = [];
  }

  console.log(
    "Supported symbols:",
    SUPPORTED_SYMBOLS.map((s) => s.baseSymbol)
  );

  app.get("/symbols", (req: Request, res: Response) => {
    res.json(SUPPORTED_SYMBOLS.map((s) => s.baseSymbol));
  });

  const server = app.listen(3000, () => {
    console.log("Server running on port 3000");
  });

  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    console.log("Client connected");

    const subscriptions = SUPPORTED_SYMBOLS.map((symbolPair) => {
      const streams = [];

      // Add Reya stream if available
      if (symbolPair.reyaSymbol) {
        try {
          const reyaStream = reyaService
            .getPriceStream(symbolPair.reyaSymbol)
            .pipe(
              map((price) => ({
                ...price,
                symbol: symbolPair.baseSymbol,
                source: "reya",
              }))
            );
          streams.push(reyaStream);
        } catch (error) {
          console.error(
            `Reya stream error for ${symbolPair.baseSymbol}:`,
            error
          );
        }
      }

      // Add Hyperliquid stream
      try {
        const hyperliquidStream = hyperliquidService
          .getPriceStream(symbolPair.hyperliquidSymbol)
          .pipe(
            map((price) => ({
              ...price,
              symbol: symbolPair.baseSymbol,
              source: "hyperliquid",
            }))
          );
        streams.push(hyperliquidStream);
      } catch (error) {
        console.error(
          `Hyperliquid stream error for ${symbolPair.baseSymbol}:`,
          error
        );
      }

      if (streams.length === 0) {
        console.warn(`No streams available for ${symbolPair.baseSymbol}`);
        return null;
      }

      return merge(...streams).subscribe(
        (price: Price) => {
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify(price));
          }
        },
        (error) =>
          console.error(
            `Error in price stream for ${symbolPair.baseSymbol}:`,
            error
          )
      );
    }).filter(Boolean);

    ws.on("close", () => {
      console.log("Client disconnected");
      subscriptions.forEach((sub) => sub?.unsubscribe());
    });
  });

  process.on("SIGTERM", () => {
    console.log("SIGTERM received. Closing server...");
    server.close(() => {
      try {
        reyaService.disconnect();
      } catch (error) {
        console.warn("Error disconnecting Reya service:", error);
      }
      try {
        hyperliquidService.disconnect();
      } catch (error) {
        console.warn("Error disconnecting Hyperliquid service:", error);
      }
      process.exit(0);
    });
  });
};

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  console.error("Error details:", error instanceof Error ? error.stack : error);
  process.exit(1);
});

// Add global error handlers
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  console.error("Stack:", error.stack);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});
