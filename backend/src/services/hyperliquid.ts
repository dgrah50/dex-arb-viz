import { Observable, interval, Subject } from "rxjs";
import { switchMap, distinctUntilChanged, filter } from "rxjs/operators";
import { PriceData, PriceStreamService } from "./types";

interface HyperliquidUniverse {
  name: string;
  szDecimals: number;
  maxLeverage: number;
  onlyIsolated?: boolean;
  isDelisted?: boolean;
}

interface HyperliquidAssetContext {
  dayNtlVlm: string;
  funding: string;
  impactPxs: string[];
  markPx: string;
  midPx: string;
  openInterest: string;
  oraclePx: string;
  premium: string;
  prevDayPx: string;
}

interface HyperliquidMetaResponse {
  universe: HyperliquidUniverse[];
}

interface HyperliquidMetaAndAssetCtxsResponse {
  meta: HyperliquidMetaResponse;
  assetCtxs: HyperliquidAssetContext[];
}

/**
 * Service for interacting with Hyperliquid Protocol's API to stream price data
 */
export class HyperliquidService implements PriceStreamService {
  private messageSubject = new Subject<PriceData>();
  private activeSubscriptions = new Set<string>();
  private readonly pollInterval = 500;
  private universeCache: HyperliquidUniverse[] = [];
  private isInitialized = false;
  private pricePollingSubscription: any = null;
  private readonly baseUrl = "https://api.hyperliquid.xyz/info";

  constructor() {
    // Add constructor for consistency with ReyaService
  }

  /**
   * Fetch and cache the universe metadata from Hyperliquid API
   */
  private async fetchUniverseMetadata(): Promise<void> {
    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "meta",
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const metaData: HyperliquidMetaResponse = await response.json();
      this.universeCache = metaData.universe;

      console.log("Fetched Hyperliquid universe metadata:", metaData);
    } catch (error) {
      console.error("Failed to fetch Hyperliquid universe metadata:", error);
      throw error;
    }
  }

  /**
   * Initialize the Hyperliquid service and fetch necessary metadata
   */
  private async initialize() {
    if (this.isInitialized) return;

    try {
      await this.fetchUniverseMetadata();
      this.isInitialized = true;
      console.log("Hyperliquid service initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Hyperliquid service:", error);
      throw error;
    }
  }

  /**
   * Start polling for price updates for all active subscriptions
   */
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

  /**
   * Connect to the Hyperliquid service and initialize price polling
   */
  public async connect(): Promise<void> {
    await this.initialize();
    this.startPricePolling();
  }

  /**
   * Disconnect from the Hyperliquid service and cleanup all resources
   */
  public disconnect(): void {
    if (this.pricePollingSubscription) {
      this.pricePollingSubscription.unsubscribe();
      this.pricePollingSubscription = null;
    }
    this.messageSubject.complete();
    this.activeSubscriptions.clear();
    this.isInitialized = false;
    this.universeCache = [];
  }

  /**
   * Get list of available trading symbols from Hyperliquid markets
   */
  public async getAvailableSymbols(): Promise<string[]> {
    await this.initialize();

    try {
      // Return all available perpetual symbols from the universe
      return this.universeCache
        .filter((asset) => !asset.isDelisted)
        .map((asset) => asset.name);
    } catch (error) {
      console.error("Error fetching Hyperliquid symbols:", error);
      throw error;
    }
  }

  /**
   * Get a price stream for a specific symbol
   */
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

  /**
   * Fetch current prices for multiple symbols from Hyperliquid API
   */
  private async fetchPrices(symbols: string[]): Promise<PriceData[]> {
    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "metaAndAssetCtxs",
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: [HyperliquidMetaResponse, HyperliquidAssetContext[]] = await response.json();
      const [meta, assetCtxs] = data;

      // Update universe cache if needed
      this.universeCache = meta.universe;

      // Map asset contexts to price data
      const prices: PriceData[] = [];
      
      for (let i = 0; i < assetCtxs.length && i < meta.universe.length; i++) {
        const assetContext = assetCtxs[i];
        const universeItem = meta.universe[i];
        
        // Only include symbols that are in our active subscriptions
        if (symbols.includes(universeItem.name)) {
          prices.push({
            symbol: universeItem.name,
            price: Number(assetContext.markPx),
            timestamp: Date.now(),
            source: "hyperliquid" as const,
          });
        }
      }

      return prices;
    } catch (error) {
      console.error("Error fetching Hyperliquid prices:", error);
      throw error;
    }
  }
}