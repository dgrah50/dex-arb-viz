import { create } from "zustand";
import { PriceData, priceWebSocketService } from "../api/priceWebSocket";
import { fetchAvailableSymbols } from "../api/symbolsApi";

interface PriceState {
  prices: {
    [symbol: string]: {
      reya?: PriceData;
      vertex?: PriceData;
    };
  };
  selectedSymbols: string[];
  availableSymbols: string[];
  isLoadingSymbols: boolean;
  error: string | null;
  addSymbol: (symbol: string) => void;
  removeSymbol: (symbol: string) => void;
  updatePrice: (data: PriceData) => void;
  fetchSymbols: () => Promise<void>;
}

export const usePriceStore = create<PriceState>((set) => ({
  prices: {},
  selectedSymbols: [],
  availableSymbols: [],
  isLoadingSymbols: false,
  error: null,

  addSymbol: (symbol) =>
    set((state) => ({
      selectedSymbols: [...new Set([...state.selectedSymbols, symbol])],
    })),

  removeSymbol: (symbol) =>
    set((state) => ({
      selectedSymbols: state.selectedSymbols.filter((s) => s !== symbol),
    })),

  updatePrice: (data) =>
    set((state) => ({
      prices: {
        ...state.prices,
        [data.symbol]: {
          ...state.prices[data.symbol],
          [data.source]: data,
        },
      },
    })),

  fetchSymbols: async () => {
    set({ isLoadingSymbols: true, error: null });
    try {
      const symbols = await fetchAvailableSymbols();
      set({ availableSymbols: symbols, isLoadingSymbols: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch symbols",
        isLoadingSymbols: false,
      });
    }
  },
}));

// Subscribe to WebSocket updates
priceWebSocketService.subscribe((data) => {
  usePriceStore.getState().updatePrice(data);
});
