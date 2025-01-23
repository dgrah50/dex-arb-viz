import React, { useEffect, useCallback, useMemo, memo, useRef } from "react";
import { Button, Space, Tag, Tooltip } from "antd";
import { AgGridReact } from "@ag-grid-community/react";
import {
  ColDef,
  ICellRendererParams,
  GridApi,
  GridReadyEvent,
} from "@ag-grid-community/core";
import "@ag-grid-community/styles/ag-grid.css";
import "@ag-grid-community/styles/ag-theme-alpine.css";
import { DeleteOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { getDirectionLabel, SpreadInfo } from "../utils/priceUtils";
import { usePriceStore } from "../store/priceStore";
import { Spin } from "antd";

import { ModuleRegistry } from "@ag-grid-community/core";
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";

ModuleRegistry.registerModules([ClientSideRowModelModule]);

export interface PriceRecord {
  key: string;
  symbol: string;
  reyaPrice?: number;
  vertexPrice?: number;
  spread?: SpreadInfo;
  action?: React.ReactNode;
}

const SPREAD_LEGEND = [
  { color: "#1890ff", label: "Reya Price Higher" },
  { color: "#722ed1", label: "Vertex Price Higher" },
  { color: "#8c8c8c", label: "Equal Prices" },
];

interface SymbolCellRendererProps extends ICellRendererParams {
  value: string;
  onClick: (symbol: string) => void;
}

const SymbolCellRenderer = memo<SymbolCellRendererProps>(
  ({ value, onClick }) => (
    <Button type="link" onClick={() => onClick(value)}>
      {value}
    </Button>
  )
);

interface PriceCellRendererProps extends ICellRendererParams {
  data: PriceRecord;
}

const SpreadCellRenderer = memo<PriceCellRendererProps>(({ data }) => {
  if (!data.spread) return "-";
  return (
    <Tag color={data.spread.color}>
      {data.spread.value.toFixed(2)}% (
      {getDirectionLabel(data.spread.direction)})
    </Tag>
  );
});

const ActionCellRenderer = memo<
  PriceCellRendererProps & { onRemove: (symbol: string) => void }
>(({ data, onRemove }) => (
  <Button
    type="text"
    icon={<DeleteOutlined />}
    onClick={() => onRemove(data.symbol)}
  />
));

const SpreadHeaderComponent = memo(() => (
  <Space>
    Spread
    <Tooltip
      title={
        <div>
          {SPREAD_LEGEND.map(({ color, label }) => (
            <div key={color}>
              <Tag color={color}>{label}</Tag>
            </div>
          ))}
        </div>
      }
    >
      <InfoCircleOutlined />
    </Tooltip>
  </Space>
));

const LoadingOverlay = memo(() => <Spin />);

export interface PriceGridProps {
  onSymbolClick: (symbol: string) => void;
  onRemoveSymbol: (symbol: string) => void;
}

export const PriceGrid = memo<PriceGridProps>(
  ({ onSymbolClick, onRemoveSymbol }) => {
    const gridApiRef = useRef<GridApi | null>(null);
    const selectedSymbols = usePriceStore((state) => state.selectedSymbols);
    const prices = usePriceStore((state) => state.getFilteredPrices());

    const getRowId = useCallback(
      (params: { data: PriceRecord }) => params.data.symbol,
      []
    );

    const onGridReady = useCallback((params: GridReadyEvent) => {
      gridApiRef.current = params.api;
    }, []);

    const columnDefs = useMemo<ColDef<PriceRecord>[]>(
      () => [
        {
          field: "symbol",
          headerName: "Symbol",
          cellRenderer: SymbolCellRenderer,
          cellRendererParams: {
            onClick: onSymbolClick,
          },
        },
        {
          field: "reyaPrice",
          headerName: "Reya Price",
          valueFormatter: (params) => params.value?.toFixed(4) || "-",
        },
        {
          field: "vertexPrice",
          headerName: "Vertex Price",
          valueFormatter: (params) => params.value?.toFixed(4) || "-",
        },
        {
          field: "spread",
          headerName: "Spread",
          cellRenderer: SpreadCellRenderer,
          headerComponent: SpreadHeaderComponent,
        },
        {
          field: "action",
          headerName: "Action",
          cellRenderer: ActionCellRenderer,
          cellRendererParams: {
            onRemove: onRemoveSymbol,
          },
          width: 100,
        },
      ],
      [onSymbolClick, onRemoveSymbol]
    );

    useEffect(() => {
      if (!gridApiRef.current) return;

      const updatedData = selectedSymbols.map((symbol) => ({
        key: symbol,
        symbol,
        reyaPrice: prices[symbol]?.reya?.price,
        vertexPrice: prices[symbol]?.vertex?.price,
        spread: prices[symbol]?.spread,
      }));

      if (selectedSymbols.length > 0) {
        gridApiRef.current.setRowData(updatedData);
      }
    }, [selectedSymbols, prices]);

    const defaultColDef = useMemo(
      () => ({
        sortable: true,
        filter: true,
        resizable: true,
      }),
      []
    );

    return (
      <div className="ag-theme-alpine" style={{ height: 400, width: "100%" }}>
        <AgGridReact
          columnDefs={columnDefs}
          domLayout="autoHeight"
          suppressPaginationPanel={true}
          defaultColDef={defaultColDef}
          loadingOverlayComponent={LoadingOverlay}
          onGridReady={onGridReady}
          getRowId={getRowId}
          debug
        />
      </div>
    );
  }
);
