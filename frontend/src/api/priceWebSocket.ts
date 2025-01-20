export interface PriceData {
  source: "reya" | "vertex";
  symbol: string;
  price: number;
  timestamp: number;
}

class PriceWebSocketService {
  private reyaWs: WebSocket | null = null;
  private vertexWs: WebSocket | null = null;
  private subscribers: ((data: PriceData) => void)[] = [];

  constructor() {
    this.initializeWebSockets();
  }

  private initializeWebSockets() {
    // Initialize Reya WebSocket
    this.reyaWs = new WebSocket("ws://localhost:3000/ws/reya");
    this.reyaWs.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.notifySubscribers({ ...data, source: "reya" });
    };

    // Initialize Vertex WebSocket
    this.vertexWs = new WebSocket("ws://localhost:3000/ws/vertex");
    this.vertexWs.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.notifySubscribers({ ...data, source: "vertex" });
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
    if (this.reyaWs) {
      this.reyaWs.close();
    }
    if (this.vertexWs) {
      this.vertexWs.close();
    }
  }
}

export const priceWebSocketService = new PriceWebSocketService();
