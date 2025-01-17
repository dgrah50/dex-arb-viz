import { create } from "zustand";

interface GlobalState {
  selectedDatasets: string[];
  startDate: string;
  endDate: string;
  percentageChange: number;
  drilldownDataset: string | null;
  graphStartDate: string | null;
  graphEndDate: string | null;
  datesHaveLoaded: boolean;
  nDayShift: number;
  setSelectedDatasets: (datasets: string[]) => void;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  setPercentageChange: (pctChange: number) => void;
  setDrilldownDataset: (dataset: string) => void;
  setGraphStartDate: (date: string) => void;
  setGraphEndDate: (date: string) => void;
  setDatesHaveLoaded: (hasLoaded: boolean) => void;
  setnDayShift: (nDayShift: number) => void;
}

export const useGlobalStore = create<GlobalState>((set) => ({
  selectedDatasets: [],
  startDate: "",
  endDate: "",
  percentageChange: 0,
  drilldownDataset: null,
  graphStartDate: null,
  graphEndDate: null,
  datesHaveLoaded: false,
  nDayShift: 1,
  setSelectedDatasets: (datasets) => set({ selectedDatasets: datasets }),
  setStartDate: (date) => set({ startDate: date }),
  setEndDate: (date) => set({ endDate: date }),
  setPercentageChange: (pctChange) => set({ percentageChange: pctChange }),
  setDrilldownDataset: (dataset) => set({ drilldownDataset: dataset }),
  setGraphStartDate: (date) => set({ graphStartDate: date }),
  setGraphEndDate: (date) => set({ graphEndDate: date }),
  setDatesHaveLoaded: (isLoaded: boolean) => set({ datesHaveLoaded: isLoaded }),
  setnDayShift: (nDayShift: number) => set({ nDayShift }),
}));
