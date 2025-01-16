import Koa from "koa";
import Router from "@koa/router";
import { WebSocketServer } from "ws";
import { merge } from "rxjs";
import { ReyaService } from "./services/reya.js";
import { VertexService } from "./services/vertex.js";
import { map } from "rxjs/operators";
import serve from "koa-static";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Price {
  symbol: string;
  price: number;
  timestamp: number;
  source: string;
}

const startServer = async () => {
  const app = new Koa();
  const router = new Router();
  const reyaService = new ReyaService();
  const vertexService = new VertexService();

  // Serve static files from the public directory
  app.use(serve(path.join(__dirname, "../../public")));

  // Connect to services and get available symbols
  await Promise.all([reyaService.connect(), vertexService.connect()]);
  const [reyaSymbols, vertexSymbols] = await Promise.all([
    reyaService.getAvailableSymbols(),
    vertexService.getAvailableSymbols(),
  ]);

  // Find common symbols between both services
  const SUPPORTED_SYMBOLS = reyaSymbols
    .map((symbol) => ({
      reyaSymbol: symbol,
      baseSymbol: symbol.replace("-rUSD", ""),
      vertexSymbol: vertexSymbols.find(
        (vs) => vs.replace("-PERP", "") === symbol.replace("-rUSD", "")
      ),
    }))
    .filter(
      (
        pair
      ): pair is {
        reyaSymbol: string;
        baseSymbol: string;
        vertexSymbol: string;
      } => pair.vertexSymbol !== undefined
    );

  console.log(
    "Supported symbols:",
    SUPPORTED_SYMBOLS.map((s) => s.baseSymbol)
  );

  router.get("/symbols", async (ctx) => {
    ctx.body = SUPPORTED_SYMBOLS.map((s) => s.baseSymbol);
  });

  app.use(router.routes()).use(router.allowedMethods());

  const server = app.listen(3000, () =>
    console.log("Server running on port 3000")
  );

  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    console.log("Client connected");

    // For each supported symbol, create price streams from both sources
    const subscriptions = SUPPORTED_SYMBOLS.map((symbolPair) => {
      const reyaStream = reyaService.getPriceStream(symbolPair.reyaSymbol).pipe(
        map((price) => ({
          ...price,
          symbol: symbolPair.baseSymbol,
          source: "reya",
        }))
      );

      const vertexStream = vertexService
        .getPriceStream(symbolPair.vertexSymbol)
        .pipe(
          map((price) => ({
            ...price,
            symbol: symbolPair.baseSymbol,
            source: "vertex",
          }))
        );

      // Merge streams from both sources
      return merge(reyaStream, vertexStream).subscribe(
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
    });

    ws.on("close", () => {
      console.log("Client disconnected");
      // Cleanup subscriptions
      subscriptions.forEach((sub) => sub.unsubscribe());
    });
  });

  // Graceful shutdown
  process.on("SIGTERM", () => {
    console.log("SIGTERM received. Closing server...");
    server.close(() => {
      reyaService.disconnect();
      vertexService.disconnect();
      process.exit(0);
    });
  });
};

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
