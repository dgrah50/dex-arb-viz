import { Observable } from "rxjs";

export interface PriceData {
  symbol: string;
  price: number;
  timestamp: number;
  source: "reya" | "vertex";
}

export interface PriceStreamService {
  // Connect to the service (if needed)
  connect(): void;

  // Disconnect from the service (if needed)
  disconnect(): void;

  // Get list of available trading pairs
  getAvailableSymbols(): Promise<string[]>;

  // Get real-time price stream for a symbol
  getPriceStream(symbol: string): Observable<PriceData>;
}
