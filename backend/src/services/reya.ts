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
  symbol: string;
  oraclePrice?: string;
  poolPrice?: string;
  updatedAt: number;
}

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
          this.socket?.subscribe(`/v2/prices/${marketId}`);
        });
      },
      onClose: () => {
        console.log("Reya WebSocket closed");
        this.isInitialized = false;
      },
      onMessage: (message: SocketMessage) => {
        this.messageSubject.next(message);
      },
      onError: () => {
        console.log("Reya WebSocket error");
        this.isInitialized = false;
      },
    });
  }

  /**
   * Connect to the Reya WebSocket service
   */
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.initSocket();
        if (!this.socket) {
          reject(new Error("Failed to initialize Reya socket"));
          return;
        }

        // Error handling is now done in the SocketClient constructor

        this.socket.connect();

        // Wait for connection to be established
        const checkConnection = () => {
          if (this.isInitialized) {
            resolve();
          } else {
            setTimeout(checkConnection, 100);
          }
        };

        // Timeout after 10 seconds
        setTimeout(() => {
          if (!this.isInitialized) {
            reject(new Error("Reya connection timeout"));
          }
        }, 10000);

        checkConnection();
      } catch (error) {
        reject(error);
      }
    });
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
    return markets.map((market) => market.ticker);
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

    // Convert symbol format from DOGE-rUSD to DOGERUSDPERP
    const marketId = symbol.replace("-rUSD", "RUSDPERP");
    this.activeSubscriptions.add(marketId);
    this.socket.subscribe(`/v2/prices/${marketId}`);

    return this.messageSubject.pipe(
      // Filter for price update messages for this specific market ID
      filter(
        (message): message is SocketMessage & { data: ReyaPriceMessage } => {
          if (message.type !== "channel_data") return false;
          if (
            typeof (message as any).data !== "object" ||
            !(message as any).data
          )
            return false;
          if (
            !(
              "poolPrice" in (message as any).data ||
              "oraclePrice" in (message as any).data
            )
          )
            return false;

          // Check if this message is for our specific market ID
          return message.channel === `/v2/prices/${marketId}`;
        }
      ),
      map((message) => {
        const priceMessage = (message as any).data as ReyaPriceMessage;
        // Use poolPrice if available, otherwise fall back to oraclePrice
        const price = priceMessage.poolPrice || priceMessage.oraclePrice || "0";
        return {
          symbol,
          price: parseFloat(price),
          timestamp: Date.now(),
          source: "reya" as const,
        };
      })
    );
  }
}
