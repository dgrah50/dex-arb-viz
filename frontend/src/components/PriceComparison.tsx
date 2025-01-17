import React, { useEffect } from "react";
import {
  Card,
  Table,
  AutoComplete,
  Button,
  Space,
  Typography,
  Alert,
  Spin,
} from "antd";
import { usePriceStore } from "../store/priceStore";
import { DeleteOutlined } from "@ant-design/icons";

const { Title } = Typography;

interface PriceRecord {
  key: string;
  symbol: string;
  reyaPrice?: number;
  vertexPrice?: number;
}

export const PriceComparison: React.FC = () => {
  const {
    prices,
    selectedSymbols,
    availableSymbols,
    isLoadingSymbols,
    error,
    addSymbol,
    removeSymbol,
    fetchSymbols,
  } = usePriceStore();
  const [searchValue, setSearchValue] = React.useState("");

  useEffect(() => {
    fetchSymbols();
  }, []);

  const columns = [
    {
      title: "Symbol",
      dataIndex: "symbol",
      key: "symbol",
    },
    {
      title: "Reya Price",
      dataIndex: "reyaPrice",
      key: "reyaPrice",
      render: (price: number) => price?.toFixed(4) || "-",
    },
    {
      title: "Vertex Price",
      dataIndex: "vertexPrice",
      key: "vertexPrice",
      render: (price: number) => price?.toFixed(4) || "-",
    },
    {
      title: "Spread",
      key: "spread",
      render: (_: unknown, record: PriceRecord) => {
        if (!record.reyaPrice || !record.vertexPrice) return "-";
        const spread = (
          (Math.abs(record.reyaPrice - record.vertexPrice) / record.reyaPrice) *
          100
        ).toFixed(2);
        return `${spread}%`;
      },
    },
    {
      title: "Action",
      key: "action",
      render: (_: unknown, record: PriceRecord) => (
        <Button
          type="text"
          icon={<DeleteOutlined />}
          onClick={() => removeSymbol(record.symbol)}
        />
      ),
    },
  ];

  const data = selectedSymbols.map((symbol) => ({
    key: symbol,
    symbol,
    reyaPrice: prices[symbol]?.reya?.price,
    vertexPrice: prices[symbol]?.vertex?.price,
  }));

  const handleSelect = (value: string) => {
    if (value) {
      addSymbol(value.toUpperCase());
      setSearchValue("");
    }
  };

  const filteredOptions = availableSymbols
    .filter(
      (symbol) =>
        symbol.toLowerCase().includes(searchValue.toLowerCase()) &&
        !selectedSymbols.includes(symbol)
    )
    .map((symbol) => ({ value: symbol, label: symbol }));

  return (
    <Card>
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        <Title level={3}>Real-time Price Comparison</Title>

        {error && (
          <Alert message="Error" description={error} type="error" showIcon />
        )}

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

        <Table
          columns={columns}
          dataSource={data}
          pagination={false}
          bordered
          loading={isLoadingSymbols}
        />
      </Space>
    </Card>
  );
};
