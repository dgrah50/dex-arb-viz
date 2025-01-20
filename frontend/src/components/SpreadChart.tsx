import React from "react";
import { Card, Empty } from "antd";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { usePriceStore } from "../store/priceStore";
import { getDirectionLabel } from "../utils/priceUtils";

interface SpreadChartProps {
  symbol: string;
}

export const SpreadChart: React.FC<SpreadChartProps> = ({ symbol }) => {
  const prices = usePriceStore((state) => state.prices[symbol]);

  if (!prices?.history.length) {
    return (
      <Card title={`${symbol} Spread History`}>
        <Empty description="No spread data available" />
      </Card>
    );
  }

  const data = prices.history
    .filter((point) => point.spread)
    .map((point) => ({
      x: point.timestamp,
      y: point.spread!.value,
      direction: getDirectionLabel(point.spread!.direction),
    }));

  const options: Highcharts.Options = {
    title: {
      text: undefined, // We're using Card title instead
    },
    xAxis: {
      type: "datetime",
      labels: {
        format: "{value:%H:%M:%S}",
      },
    },
    yAxis: {
      title: {
        text: "Spread %",
      },
      labels: {
        format: "{value:.2f}%",
      },
    },
    series: [
      {
        type: "line",
        name: "Spread",
        data: data.map((point) => [point.x, point.y]),
        marker: {
          enabled: true,
          radius: 5,
        },
      },
    ],
    tooltip: {
      formatter: function (this: Highcharts.TooltipFormatterContextObject) {
        if (typeof this.x === "number" && typeof this.y === "number") {
          return `<b>Time:</b> ${Highcharts.dateFormat("%H:%M:%S", this.x)}<br/>
                <b>Spread:</b> ${this.y.toFixed(2)}%`;
        }
        return "";
      },
    },
    credits: {
      enabled: false,
    },
  };

  return (
    <Card title={`${symbol} Spread History`}>
      <HighchartsReact highcharts={Highcharts} options={options} />
    </Card>
  );
};
