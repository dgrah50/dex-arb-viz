import React, { useCallback, useMemo, memo } from "react";
import { AutoComplete, Space, Spin } from "antd";
import { usePriceStore } from "../store/priceStore";

export interface SymbolSearchProps {
  onSelect: (symbol: string) => void;
}

export const SymbolSearch = memo<SymbolSearchProps>(({ onSelect }) => {
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
