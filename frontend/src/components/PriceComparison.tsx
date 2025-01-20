import React, { useEffect, useCallback, useMemo, memo, useRef } from "react";
import {
  Card,
  AutoComplete,
  Button,
  Space,
  Typography,
  Alert,
  Spin,
  Tag,
  Tooltip,
} from "antd";
import { AgGridReact } from "@ag-grid-community/react";
import {
  ColDef,
  ICellRendererParams,
  GridApi,
  GridReadyEvent,
} from "@ag-grid-community/core";
import "@ag-grid-community/styles/ag-grid.css";
import "@ag-grid-community/styles/ag-theme-alpine.css";
import { usePriceStore } from "../store/priceStore";
import { DeleteOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { getDirectionLabel, SpreadInfo } from "../utils/priceUtils";
import { SpreadChart } from "./SpreadChart";

import { ModuleRegistry } from "@ag-grid-community/core";
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";

ModuleRegistry.registerModules([ClientSideRowModelModule]);

const { Title } = Typography;

interface PriceRecord {
  key: string;
  symbol: string;
  reyaPrice?: number;
  vertexPrice?: number;
  spread?: SpreadInfo;
  action?: React.ReactNode;
}

const SPREAD_LEGEND = [
  { color: "#52c41a", label: "Low Spread (< 1%)" },
  { color: "#faad14", label: "Medium Spread (1-2%)" },
  { color: "#f5222d", label: "High Spread (> 2%)" },
];

// Cell Renderers
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

// Symbol Search Component
interface SymbolSearchProps {
  onSelect: (symbol: string) => void;
}

const SymbolSearch = memo<SymbolSearchProps>(({ onSelect }) => {
  const [searchValue, setSearchValue] = React.useState("");
  const availableSymbols = usePriceStore((state) => state.availableSymbols);
  const selectedSymbols = usePriceStore((state) => state.selectedSymbols);
  const isLoadingSymbols = usePriceStore((state) => state.isLoadingSymbols);

  const filteredOptions = useMemo(
    () =>
      availableSymbols
        .filter(
          (symbol) =>
            symbol.toLowerCase().includes(searchValue.toLowerCase()) &&
            !selectedSymbols.includes(symbol)
        )
        .map((symbol) => ({ value: symbol, label: symbol })),
    [availableSymbols, selectedSymbols, searchValue]
  );

  const handleSelect = useCallback(
    (value: string) => {
      onSelect(value);
      setSearchValue("");
    },
    [onSelect]
  );

  return (
    <Space>
      <AutoComplete
        value={searchValue}
        options={filteredOptions}
        onSelect={handleSelect}
        onChange={setSearchValue}
        onSearch={setSearchValue}
        placeholder="Search and select a symbol"
        style={{ width: 300 }}
      />
      {isLoadingSymbols && <Spin />}
    </Space>
  );
});

// Price Grid Component
interface PriceGridProps {
  onSymbolClick: (symbol: string) => void;
  onRemoveSymbol: (symbol: string) => void;
}

const PriceGrid = memo<PriceGridProps>(({ onSymbolClick, onRemoveSymbol }) => {
  const gridApiRef = useRef<GridApi | null>(null);
  const selectedSymbols = usePriceStore((state) => state.selectedSymbols);
  const filteredPrices = usePriceStore((state) => state.getFilteredPrices());

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
      reyaPrice: filteredPrices[symbol]?.reya?.price,
      vertexPrice: filteredPrices[symbol]?.vertex?.price,
      spread: filteredPrices[symbol]?.spread,
    }));

    if (selectedSymbols.length > 0) {
      gridApiRef.current.setRowData(updatedData);
    }
  }, [selectedSymbols, filteredPrices]);

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
});

// Main Component
export const PriceComparison: React.FC = () => {
  const [selectedSymbolForChart, setSelectedSymbolForChart] = React.useState<
    string | null
  >(null);

  const error = usePriceStore((state) => state.error);
  const addSymbol = usePriceStore((state) => state.addSymbol);
  const removeSymbol = usePriceStore((state) => state.removeSymbol);
  const fetchSymbols = usePriceStore((state) => state.fetchSymbols);

  useEffect(() => {
    fetchSymbols();
  }, [fetchSymbols]);

  const handleSymbolSelect = useCallback(
    (value: string) => {
      if (value) {
        addSymbol(value.toUpperCase());
      }
    },
    [addSymbol]
  );

  const handleSymbolClick = useCallback((symbol: string) => {
    setSelectedSymbolForChart(symbol);
  }, []);

  const handleRemoveSymbol = useCallback(
    (symbol: string) => {
      if (selectedSymbolForChart === symbol) {
        setSelectedSymbolForChart(null);
      }
      removeSymbol(symbol);
    },
    [removeSymbol, selectedSymbolForChart]
  );

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Card>
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <Title level={3}>Real-time Price Comparison</Title>

          {error && (
            <Alert message="Error" description={error} type="error" showIcon />
          )}

          <SymbolSearch onSelect={handleSymbolSelect} />

          <PriceGrid
            onSymbolClick={handleSymbolClick}
            onRemoveSymbol={handleRemoveSymbol}
          />
        </Space>
      </Card>

      {selectedSymbolForChart && (
        <SpreadChart symbol={selectedSymbolForChart} />
      )}
    </Space>
  );
};
