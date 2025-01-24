import express, { Request, Response } from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import { merge } from "rxjs";
import { ReyaService } from "./services/reya.js";
import { VertexService } from "./services/vertex.js";
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
  const vertexService = new VertexService();

  app.use(
    cors({
      origin: "http://localhost:5173",
      credentials: true,
    })
  );

  app.use(express.static(path.join(__dirname, "../../public")));

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
      subscriptions.forEach((sub) => sub.unsubscribe());
    });
  });

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
