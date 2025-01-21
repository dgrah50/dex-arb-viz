import { create } from "zustand";
import { PriceData, priceWebSocketService } from "../api/priceWebSocket";
import { fetchAvailableSymbols } from "../api/symbolsApi";
import { SpreadInfo, calculateSpread } from "../utils/priceUtils";
import { immer } from "zustand/middleware/immer";

interface HistoricalPrice {
  timestamp: number;
  reyaPrice?: number;
  vertexPrice?: number;
  spread?: SpreadInfo;
}

interface PriceState {
  prices: {
    [symbol: string]: {
      reya?: PriceData;
      vertex?: PriceData;
      history: HistoricalPrice[];
      spread?: SpreadInfo;
    };
  };
  selectedSymbols: string[];
  availableSymbols: string[];
  isLoadingSymbols: boolean;
  error: string | null;
  getFilteredPrices: () => {
    [symbol: string]: {
      reya?: PriceData;
      vertex?: PriceData;
      history: HistoricalPrice[];
      spread?: SpreadInfo;
    };
  };
  addSymbol: (symbol: string) => void;
  removeSymbol: (symbol: string) => void;
  updatePrice: (data: PriceData) => void;
  fetchSymbols: () => Promise<void>;
  clearHistory: (symbol: string) => void;
}

const MAX_HISTORY_POINTS = 100;

// Create the store instance outside of any subscription
export const usePriceStore = create<PriceState>()(
  immer((set, get) => ({
    prices: {},
    selectedSymbols: [],
    availableSymbols: [],
    isLoadingSymbols: false,
    error: null,

    getFilteredPrices: () => {
      const state = get();
      return Object.fromEntries(
        Object.entries(state.prices).filter(([symbol]) =>
          state.selectedSymbols.includes(symbol)
        )
      );
    },

    addSymbol: (symbol: string) => {
      set((state) => {
        if (!state.selectedSymbols.includes(symbol)) {
          state.selectedSymbols.push(symbol);
          if (!state.prices[symbol]) {
            state.prices[symbol] = { history: [] };
          }
        }
      });
    },

    removeSymbol: (symbol: string) => {
      set((state) => {
        state.selectedSymbols = state.selectedSymbols.filter(
          (s: string) => s !== symbol
        );
      });
    },

    clearHistory: (symbol: string) => {
      set((state) => {
        if (state.prices[symbol]) {
          state.prices[symbol].history = [];
        }
      });
    },

    updatePrice: (data: PriceData) => {
      const currentState = get();

      const otherSource = data.source === "reya" ? "vertex" : "reya";
      const otherPrice =
        currentState.prices[data.symbol]?.[otherSource]?.price ?? undefined;

      // Calculate new spread if we have both prices
      const reyaPrice = data.source === "reya" ? data.price : otherPrice;
      const vertexPrice = data.source === "vertex" ? data.price : otherPrice;
      const spreadResult = calculateSpread(reyaPrice, vertexPrice);

      // Create new history point
      const newHistoryPoint: HistoricalPrice = {
        timestamp: data.timestamp,
        reyaPrice,
        vertexPrice,
        spread: spreadResult || undefined,
      };

      set((state) => {
        // Initialize symbol data if it doesn't exist
        if (!state.prices[data.symbol]) {
          state.prices[data.symbol] = { history: [] };
        }

        // Update the price data
        state.prices[data.symbol][data.source] = data;
        state.prices[data.symbol].spread = spreadResult || undefined;
        // Update history with proper trimming
        const newHistory = [
          ...(state.prices[data.symbol].history || []),
          newHistoryPoint,
        ];
        state.prices[data.symbol].history = newHistory.slice(
          -MAX_HISTORY_POINTS
        );
      });
    },

    fetchSymbols: async () => {
      set((state) => {
        state.isLoadingSymbols = true;
        state.error = null;
      });

      try {
        const symbols = await fetchAvailableSymbols();
        set((state) => {
          state.availableSymbols = symbols;
          state.isLoadingSymbols = false;
        });
      } catch (error) {
        set((state) => {
          state.error =
            error instanceof Error ? error.message : "Failed to fetch symbols";
          state.isLoadingSymbols = false;
        });
      }
    },
  }))
);

// Create a single subscription instance
let isSubscribed = false;

if (!isSubscribed) {
  priceWebSocketService.subscribe((data) => {
    usePriceStore.getState().updatePrice(data);
  });
  isSubscribed = true;
}
