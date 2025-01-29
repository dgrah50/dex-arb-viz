export interface PriceData {
  source: "reya" | "vertex";
  symbol: string;
  price: number;
  timestamp: number;
}

class PriceWebSocketService {
  private ws: WebSocket | null = null;

  private subscribers: ((data: PriceData) => void)[] = [];

  private BASE_RETRY_DELAY = 1000; // 1 second
  private MAX_RETRY_DELAY = 10000; // 10 seconds
  private reconnectAttempt = 0;

  constructor() {
    this.initializeWebSockets();
  }

  private initializeWebSockets() {
    try {
      this.ws = new WebSocket("ws://localhost:3000/ws");

      this.ws.onopen = () => {
        console.log("WebSocket connected successfully");
        this.reconnectAttempt = 0; // Reset attempt counter on successful connection
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.notifySubscribers(data);
      };

      this.ws.onclose = () => {
        this.reconnect();
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        this.ws?.close();
      };
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      this.reconnect();
    }
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

  private reconnect() {
    const delay = Math.min(
      this.BASE_RETRY_DELAY * Math.pow(2, this.reconnectAttempt),
      this.MAX_RETRY_DELAY
    );

    console.log(`Attempting to reconnect in ${delay}ms...`);

    setTimeout(() => {
      this.reconnectAttempt++;
      this.initializeWebSockets();
    }, delay);
  }
}

export const priceWebSocketService = new PriceWebSocketService();
