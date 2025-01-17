import {
  SocketClient,
  SocketMessage,
  ApiClient,
  MarketEntity,
} from "@reyaxyz/api-sdk";
import { Observable, Subject } from "rxjs";
import { filter, map } from "rxjs/operators";
import { PriceData, PriceStreamService } from "./types";

interface ReyaPriceMessage {
  signedPrice: {
    oraclePubKey: string;
    pricePayload: unknown;
    r: string;
    s: string;
    v: number;
  };
  poolPrice: string;
  spotPrice: string;
  assetPairId: string;
  marketId: number;
}

// Mapping between ticker symbols and their market IDs
const MARKET_ID_MAPPING = {
  "ETH-rUSD": "ETHUSDMARK",
  "BTC-rUSD": "BTCUSDMARK",
  "SOL-rUSD": "SOLUSDMARK",
  "ARB-rUSD": "ARBUSDMARK",
  "OP-rUSD": "OPUSDMARK",
  "AVAX-rUSD": "AVAXUSDMARK",
  "MKR-rUSD": "MKRUSDMARK",
  "LINK-rUSD": "LINKUSDMARK",
  "AAVE-rUSD": "AAVEUSDMARK",
  "CRV-rUSD": "CRVUSDMARK",
  "UNI-rUSD": "UNIUSDMARK",
  "SUI-rUSD": "SUIUSDMARK",
  "TIA-rUSD": "TIAUSDMARK",
  "SEI-rUSD": "SEIUSDMARK",
  "ZRO-rUSD": "ZROUSDMARK",
  "XRP-rUSD": "XRPUSDMARK",
  "WIF-rUSD": "WIFUSDMARK",
  "kPEPE-rUSD": "1000PEPEUSDMARK",
  "POPCAT-rUSD": "POPCATUSDMARK",
  "DOGE-rUSD": "DOGEUSDMARK",
  "kSHIB-rUSD": "1000SHIBUSDMARK",
  "kBONK-rUSD": "1000BONKUSDMARK",
  "APT-rUSD": "APTUSDMARK",
  "BNB-rUSD": "BNBUSDMARK",
  "JTO-rUSD": "JTOUSDMARK",
} as const;

type ReyaSymbol = keyof typeof MARKET_ID_MAPPING;

/**
 * Service for interacting with Reya's WebSocket API to stream price data
 */
export class ReyaService implements PriceStreamService {
  private socket: SocketClient | null = null;
  private messageSubject = new Subject<SocketMessage>();
  private activeSubscriptions = new Set<string>();
  private isInitialized = false;

  constructor() {
    ApiClient.configure("production");
  }

  /**
   * Initialize the WebSocket connection with proper handlers
   */
  private initSocket(): void {
    if (this.socket) return;

    this.socket = new SocketClient({
      environment: "production",
      onOpen: () => {
        console.log("Reya WebSocket connected");
        this.isInitialized = true;
        this.activeSubscriptions.forEach((marketId) => {
          this.socket?.subscribe("prices", { id: marketId });
        });
      },
      onClose: () => {
        console.log("Reya WebSocket closed");
        this.isInitialized = false;
      },
      onMessage: (message: SocketMessage) => {
        this.messageSubject.next(message);
      },
    });
  }

  /**
   * Connect to the Reya WebSocket service
   */
  public connect(): void {
    this.initSocket();
    this.socket?.connect();
  }

  /**
   * Disconnect from the Reya WebSocket service and cleanup
   */
  public disconnect(): void {
    this.activeSubscriptions.clear();
    if (this.socket) {
      this.socket.connect(); // Note: Reya SDK doesn't have disconnect, using reconnect to clear state
      this.socket = null;
    }
    this.messageSubject.complete();
  }

  /**
   * Fetch available markets from Reya API
   */
  private async getAvailableMarkets(): Promise<MarketEntity[]> {
    try {
      const markets = await ApiClient.markets.getMarkets();
      return markets;
    } catch (error) {
      console.error("Error fetching Reya markets:", error);
      throw error;
    }
  }

  /**
   * Get list of available trading symbols
   */
  public async getAvailableSymbols(): Promise<string[]> {
    const markets = await this.getAvailableMarkets();
    return markets
      .map((market) => market.ticker)
      .filter((ticker): ticker is ReyaSymbol => ticker in MARKET_ID_MAPPING);
  }

  /**
   * Get the market ID for a given symbol
   */
  private getMarketId(symbol: string): string {
    const marketId = MARKET_ID_MAPPING[symbol as ReyaSymbol];
    if (!marketId) {
      throw new Error(`No market ID found for symbol: ${symbol}`);
    }
    return marketId;
  }

  /**
   * Get a price stream for a specific symbol
   */
  public getPriceStream(symbol: string): Observable<PriceData> {
    if (!this.isInitialized) {
      this.connect();
    }

    if (!this.socket) {
      throw new Error("Reya client not initialized");
    }

    const marketId = this.getMarketId(symbol);
    this.activeSubscriptions.add(marketId);
    this.socket.subscribe("prices", { id: marketId });

    return this.messageSubject.pipe(
      // Filter for price update messages for this specific market ID
      filter(
        (
          message
        ): message is SocketMessage & { contents: ReyaPriceMessage } => {
          if (message.type !== "channel_data") return false;
          if (typeof message.contents !== "object" || !message.contents)
            return false;
          if (!("poolPrice" in message.contents)) return false;

          // Check if this message is for our specific market ID
          return (
            (message.contents as ReyaPriceMessage).assetPairId === marketId
          );
        }
      ),
      map((message) => {
        const priceMessage = message.contents as ReyaPriceMessage;
        return {
          symbol,
          price: parseFloat(priceMessage.poolPrice),
          timestamp: Date.now(),
          source: "reya" as const,
        };
      })
    );
  }
}
