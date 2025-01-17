import React, { useCallback, useMemo, useRef } from "react";
import { AgGridReact, CustomCellRendererProps } from "@ag-grid-community/react";
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import "@ag-grid-community/styles/ag-grid.css";
import "@ag-grid-community/styles/ag-theme-balham.css";
import { ColDef } from "@ag-grid-community/core";
import { PercentageChangeCellRenderer } from "./PercentageChangeCellRenderer";
import { loadingOverlayComponent } from "./LoadingOverlayComponent";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import { useGlobalStore } from "../../store/store";
import { CryptoData } from "../../api/cryptoApi";

interface CryptoGridProps {
  data: CryptoData[];
  isLoading: boolean;
}

export const CryptoGrid: React.FC<CryptoGridProps> = ({ data, isLoading }) => {
  const gridRef = useRef<AgGridReact>(null);

  const setDrilldownTicker = useGlobalStore(
    (state) => state.setDrilldownDataset
  );
  const setGraphStartDate = useGlobalStore((state) => state.setGraphStartDate);
  const setGraphEndDate = useGlobalStore((state) => state.setGraphEndDate);

  const handleDrilldown = useCallback(
    (ticker: string, date: string) => {
      const startDate = dayjs(date).subtract(1, "week").format("YYYY-MM-DD");
      const endDate = dayjs(date).add(1, "week").format("YYYY-MM-DD");
      setDrilldownTicker(ticker);
      setGraphStartDate(startDate);
      setGraphEndDate(endDate);
    },
    [setDrilldownTicker, setGraphEndDate, setGraphStartDate]
  );

  const maxPctChange = useMemo(() => {
    if (data && data.length > 0) {
      return Math.max(
        ...data.map((pctChange) => Math.abs(pctChange?.PRICE_CHANGE ?? 0))
      );
    }
    return 0;
  }, [data]);

  if (gridRef?.current) {
    if (isLoading) {
      gridRef.current?.api?.showLoadingOverlay();
    } else {
      gridRef.current?.api?.hideOverlay();
    }
  }

  const gridStyle = useMemo(() => ({ height: "100%", minHeight: 500 }), []);
  const defaultColDef = useMemo(() => ({ filter: true, resizable: true }), []);
  const autoSizeStrategy = useMemo(
    () => ({ type: "fitCellContents" } as const),
    []
  );

  const columnDefs: ColDef<CryptoData>[] = useMemo(
    () => [
      { headerName: "Ticker", field: "TICKER" },
      {
        headerName: "Date",
        field: "OPEN_TIME",
        valueFormatter: (params) => new Date(params.value).toLocaleDateString(),
      },
      { headerName: "Close", field: "CLOSE" },
      // TODO: load N dynamically
      { headerName: "Close N Days Ago", field: "CLOSE_N_DAYS_AGO" },
      {
        headerName: "Pct Change (%)",
        field: "PRICE_CHANGE",
        valueFormatter: (params) => params.value.toFixed(2),
        cellRenderer: PercentageChangeCellRenderer,
      },
      { headerName: "High", field: "HIGH" },
      { headerName: "Low", field: "LOW" },
      { headerName: "Open", field: "OPEN" },
      { headerName: "Volume", field: "VOLUME" },
      { headerName: "Trades", field: "NUM_TRADES" },
      { headerName: "QAV", field: "QAV" },
      { headerName: "TBBAV", field: "TBBAV" },
      { headerName: "TBQAV", field: "TBQAV" },
      {
        headerName: "Drilldown",
        cellRenderer: (params: CustomCellRendererProps) => (
          <Link
            to="/charts"
            onClick={() => handleDrilldown(params.data.TICKER, params.value)}
          >
            View Chart
          </Link>
        ),
      },
    ],
    [handleDrilldown]
  );

  return (
    <div className="ag-theme-balham" style={gridStyle}>
      <AgGridReact<CryptoData>
        ref={gridRef}
        rowData={data}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        modules={[ClientSideRowModelModule]}
        context={{ maxPctChange }}
        components={PercentageChangeCellRenderer}
        autoSizeStrategy={autoSizeStrategy}
        loadingOverlayComponent={loadingOverlayComponent}
        reactiveCustomComponents
      />
    </div>
  );
};
