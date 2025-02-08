import { Observable } from "rxjs";

export interface PriceData {
  symbol: string;
  price: number;
  timestamp: number;
  source: "reya" | "hyperliquid";
}

export interface PriceStreamService {
  connect(): Promise<void>;

  disconnect(): void;

  getAvailableSymbols(): Promise<string[]>;

  getPriceStream(symbol: string): Observable<PriceData>;
}
