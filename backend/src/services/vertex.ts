import { Observable, interval, Subject } from "rxjs";
import { switchMap, distinctUntilChanged, filter } from "rxjs/operators";
import {
  createVertexClient,
  ProductEngineType,
  VertexClient,
} from "@vertex-protocol/client";
import { JsonRpcProvider } from "ethers";
import { PriceData, PriceStreamService } from "./types";

interface VertexSymbol {
  product_id: number;
  symbol: string;
}

interface PerpPriceInfo {
  markPrice: string;
  indexPrice: string;
  lastPrice: string;
  productId: number;
}

type VertexPriceResponse = Record<number, PerpPriceInfo>;

export class VertexService implements PriceStreamService {
  private client: VertexClient | null = null;
  private messageSubject = new Subject<PriceData>();
  private activeSubscriptions = new Set<string>();
  private readonly pollInterval = 500;
  private productCache: Map<string, number> = new Map();
  private symbolsMap: Map<number, string> = new Map();
  private isInitialized = false;
  private pricePollingSubscription: any = null;

  constructor() {
    // Add constructor for consistency with ReyaService
  }

  private async fetchSymbolsMap(): Promise<void> {
    try {
      const response = await fetch(
        "https://gateway.prod.vertexprotocol.com/v1/symbols"
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const symbols: VertexSymbol[] = await response.json();

      // Clear and repopulate the maps
      this.symbolsMap.clear();
      this.productCache.clear();

      symbols.forEach(({ product_id, symbol }) => {
        this.symbolsMap.set(product_id, symbol);
        this.productCache.set(symbol, product_id);
      });

      console.log("Fetched symbols mapping:", symbols);
    } catch (error) {
      console.error("Failed to fetch symbols:", error);
      throw error;
    }
  }

  private async initialize() {
    if (this.isInitialized) return;

    try {
      await this.fetchSymbolsMap();

      // Create a provider for Arbitrum
      const provider = new JsonRpcProvider("https://arb1.arbitrum.io/rpc", {
        name: "arbitrum-one",
        chainId: 42161,
      });

      // Create read-only client (no signer needed for price feeds)
      this.client = await createVertexClient("arbitrum", {
        signerOrProvider: provider,
      });

      this.isInitialized = true;
      console.log("Vertex client initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Vertex client:", error);
      throw error;
    }
  }

  private startPricePolling() {
    if (this.pricePollingSubscription) return;

    this.pricePollingSubscription = interval(this.pollInterval)
      .pipe(
        switchMap(async () => {
          if (this.activeSubscriptions.size === 0) return [];

          return this.fetchPrices(Array.from(this.activeSubscriptions));
        })
      )
      .subscribe({
        next: (prices) => {
          prices.forEach((price) => this.messageSubject.next(price));
        },
        error: (error) => {
          console.error("Error in price polling:", error);
        },
      });
  }

  public async connect(): Promise<void> {
    await this.initialize();
    this.startPricePolling();
  }

  public disconnect(): void {
    if (this.pricePollingSubscription) {
      this.pricePollingSubscription.unsubscribe();
      this.pricePollingSubscription = null;
    }
    this.messageSubject.complete();
    this.activeSubscriptions.clear();
    this.client = null;
    this.isInitialized = false;
    this.productCache.clear();
    this.symbolsMap.clear();
  }

  public async getAvailableSymbols(): Promise<string[]> {
    await this.initialize();

    try {
      if (!this.client) {
        throw new Error("Vertex client not initialized");
      }
      const markets = await this.client.market.getAllMarkets();

      return markets
        .filter((market) => market.type === ProductEngineType.PERP)
        .map((market) => this.symbolsMap.get(market.product.productId))
        .filter((symbol): symbol is string => {
          if (typeof symbol !== "string") return false;
          const isValid = symbol.endsWith("-PERP");
          if (!isValid) {
            console.warn(`Skipping invalid symbol mapping for product`);
          }
          return isValid;
        });
    } catch (error) {
      console.error("Error fetching Vertex markets:", error);
      throw error;
    }
  }

  private async getProductId(symbol: string): Promise<number> {
    await this.initialize();

    // Check cache first
    const cachedId = this.productCache.get(symbol.toUpperCase());
    if (cachedId) {
      return cachedId;
    }

    // If not in cache, try to refresh the symbols map
    await this.fetchSymbolsMap();

    const productId = this.productCache.get(symbol.toUpperCase());
    if (!productId) {
      throw new Error(`No product found for symbol: ${symbol}`);
    }

    return productId;
  }

  public getPriceStream(symbol: string): Observable<PriceData> {
    if (!this.isInitialized) {
      this.connect(); // Auto-connect like ReyaService
    }

    this.activeSubscriptions.add(symbol);
    this.startPricePolling();

    return this.messageSubject.pipe(
      filter((price) => price.symbol === symbol),
      distinctUntilChanged((prev, curr) => prev.price === curr.price)
    );
  }

  private async fetchPrices(symbols: string[]): Promise<PriceData[]> {
    if (!this.client) {
      throw new Error("Vertex client not initialized"); // Consistent error messaging
    }

    try {
      const productIds = await Promise.all(
        symbols.map((symbol) => this.getProductId(symbol))
      );

      const response = await this.client.perp.getMultiProductPerpPrices({
        productIds,
      });

      // Type assertion since we know the response shape
      const priceData = response as unknown as VertexPriceResponse;

      return Object.entries(priceData || {}).map(([productId, priceInfo]) => {
        const symbol = this.symbolsMap.get(Number(productId));
        if (!symbol) {
          console.error(
            `No symbol found for product ID: ${productId}`,
            priceData
          );
          throw new Error(`No symbol found for product ID: ${productId}`);
        }

        return {
          symbol,
          price: Number(priceInfo.markPrice),
          timestamp: Date.now(),
          source: "vertex" as const,
        };
      });
    } catch (error) {
      console.error("Error fetching Vertex prices:", error); // Consistent error messaging
      throw error;
    }
  }
}
