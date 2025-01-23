import React, { useEffect, useCallback } from "react";
import { Card, Space, Typography, Alert } from "antd";
import { usePriceStore } from "../store/priceStore";
import { SpreadChart } from "./SpreadChart";
import { SymbolSearch } from "./SymbolSearch";
import { PriceGrid } from "./PriceGrid";

const { Title } = Typography;

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
