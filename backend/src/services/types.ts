import { Observable } from "rxjs";

export interface PriceData {
  symbol: string;
  price: number;
  timestamp: number;
  source: "reya" | "vertex";
}

export interface PriceStreamService {
  connect(): void;

  disconnect(): void;

  getAvailableSymbols(): Promise<string[]>;

  getPriceStream(symbol: string): Observable<PriceData>;
}
