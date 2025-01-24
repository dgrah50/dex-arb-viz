export interface PriceData {
  source: "reya" | "vertex";
  symbol: string;
  price: number;
  timestamp: number;
}

class PriceWebSocketService {
  private ws: WebSocket | null = null;

  private subscribers: ((data: PriceData) => void)[] = [];

  constructor() {
    this.initializeWebSockets();
  }

  private initializeWebSockets() {
    this.ws = new WebSocket("ws://localhost:3000/ws");
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.notifySubscribers(data);
    };
  }

  private notifySubscribers(data: PriceData) {
    this.subscribers.forEach((callback) => callback(data));
  }

  subscribe(callback: (data: PriceData) => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback);
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

export const priceWebSocketService = new PriceWebSocketService();
